import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ShirtConfig, TeePart } from '../types';
import { CANVAS_SIZE, paintPartTexture } from '../utils/canvasTee';

export interface ThreeCanvasHandle {
  triggerGust: () => void;
  rotateTo: (targetRad: number) => void;
  exportImage: (transparent?: boolean) => string;
  getCanvas: () => HTMLCanvasElement | null;
  setRecordingQuality: (enabled: boolean) => void;
  repaintNow: () => void;
  setAutoRotate: (auto: boolean) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  toggleWireframe: () => boolean;
}

interface ThreeCanvasProps {
  config: ShirtConfig;
  onDesignChange: (part: 'front' | 'back' | 'sleeveLeft' | 'sleeveRight', updates: { x?: number; y?: number; sc?: number; rot?: number }) => void;
  onPartSelect?: (part: TeePart) => void;
  onPointerActiveChange?: (active: boolean) => void;
  onHoverPartChange?: (part: TeePart | null) => void;
  onTriggerUpload?: (part: TeePart) => void;
  sidebarOpen?: boolean;
}

export const ThreeCanvas = forwardRef<ThreeCanvasHandle, ThreeCanvasProps>(
  (
    {
      config,
      onDesignChange,
      onPartSelect,
      onPointerActiveChange,
      onHoverPartChange,
      onTriggerUpload,
      sidebarOpen = true,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Zoom feedback UI state
    const [zoomBadge, setZoomBadge] = useState<{ percent: number; visible: boolean }>({ percent: 100, visible: false });
    const zoomBadgeTimeoutRef = useRef<number | null>(null);

    // Three.js camera distance refs for responsive scaling & smooth mouse wheel zoom
    const baseDistRef = useRef<number>(5.25);
    const targetZRef = useRef<number>(5.25);
    const userHasZoomedRef = useRef<boolean>(false);
    const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
    const initialPinchDistRef = useRef<number | null>(null);
    const initialPinchZRef = useRef<number>(5.25);

    const triggerZoomBadge = useCallback((targetZ: number, baseZ: number) => {
      const pct = Math.round((baseZ / Math.max(0.1, targetZ)) * 100);
      setZoomBadge({ percent: pct, visible: true });
      if (zoomBadgeTimeoutRef.current !== null) {
        window.clearTimeout(zoomBadgeTimeoutRef.current);
      }
      zoomBadgeTimeoutRef.current = window.setTimeout(() => {
        setZoomBadge((prev) => ({ ...prev, visible: false }));
      }, 1200);
    }, []);

    // Three.js instances
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const rendererPixelRatioRef = useRef<number>(1);
    const recordingQualityRef = useRef<boolean>(false);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const teeGroupRef = useRef<THREE.Group | null>(null);

    // Mesh references
    const frontMeshRef = useRef<THREE.Mesh | null>(null);
    const backMeshRef = useRef<THREE.Mesh | null>(null);
    const sleeveLeftMeshRef = useRef<THREE.Mesh | null>(null);
    const sleeveRightMeshRef = useRef<THREE.Mesh | null>(null);
    const collarMeshesRef = useRef<THREE.Mesh[]>([]);
    const clothMeshesRef = useRef<THREE.Mesh[]>([]);

    // Material references
    const frontMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
    const backMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
    const sleeveLeftMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
    const sleeveRightMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
    const collarMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
    const innerMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

    // Canvas textures for all parts
    const cvFRef = useRef<HTMLCanvasElement | null>(null);
    const cvBRef = useRef<HTMLCanvasElement | null>(null);
    const cvSLRef = useRef<HTMLCanvasElement | null>(null);
    const cvSRRef = useRef<HTMLCanvasElement | null>(null);

    const texFRef = useRef<THREE.CanvasTexture | null>(null);
    const texBRef = useRef<THREE.CanvasTexture | null>(null);
    const texSLRef = useRef<THREE.CanvasTexture | null>(null);
    const texSRRef = useRef<THREE.CanvasTexture | null>(null);

    // Interaction & Animation state
    const isWireframeRef = useRef<boolean>(false);
    const windRef = useRef<number>(0);
    const ryRef = useRef<number>(-0.35); // slight initial 3/4 perspective
    const targetRyRef = useRef<number | null>(null);
    const vyRef = useRef<number>(0);
    const modeRef = useRef<'scale' | 'rot_design' | 'move' | 'part_clicked' | 'rot' | null>(null);
    const dragPartRef = useRef<'front' | 'back' | 'sleeveLeft' | 'sleeveRight'>('front');
    const dragOffsetRef = useRef<[number, number]>([0, 0]);
    const startScRef = useRef<number>(1.0);
    const startRotRef = useRef<number>(0);
    const startDistRef = useRef<number>(100);
    const startAngleRef = useRef<number>(0);
    const startPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const pointerDownTimeRef = useRef<number>(0);
    const pointerDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const hoveredPartRef = useRef<TeePart | null>(null);
    const lastXRef = useRef<number>(0);
    const dirtyRef = useRef<boolean>(true);
    const autoRotateRef = useRef<boolean>(config.autoRotate ?? false);

    // Keep config in ref for render loop & callbacks
    const configRef = useRef<ShirtConfig>(config);
    configRef.current = config;

    const onDesignChangeRef = useRef(onDesignChange);
    onDesignChangeRef.current = onDesignChange;

    const onPartSelectRef = useRef(onPartSelect);
    onPartSelectRef.current = onPartSelect;

    const onHoverPartChangeRef = useRef(onHoverPartChange);
    onHoverPartChangeRef.current = onHoverPartChange;

    const onTriggerUploadRef = useRef(onTriggerUpload);
    onTriggerUploadRef.current = onTriggerUpload;

    const sidebarOpenRef = useRef(sidebarOpen);
    sidebarOpenRef.current = sidebarOpen;

    // Repaint all textures
    const repaintTextures = useCallback(() => {
      if (!cvFRef.current || !cvBRef.current || !texFRef.current || !texBRef.current) return;
      paintPartTexture(cvFRef.current, 'front', configRef.current);
      paintPartTexture(cvBRef.current, 'back', configRef.current);
      texFRef.current.needsUpdate = true;
      texBRef.current.needsUpdate = true;

      if (cvSLRef.current && texSLRef.current) {
        paintPartTexture(cvSLRef.current, 'sleeveLeft', configRef.current);
        texSLRef.current.needsUpdate = true;
      }
      if (cvSRRef.current && texSRRef.current) {
        paintPartTexture(cvSRRef.current, 'sleeveRight', configRef.current);
        texSRRef.current.needsUpdate = true;
      }

      if (collarMatRef.current) {
        collarMatRef.current.color.set(configRef.current.parts.collar.color);
      }
      if (innerMatRef.current) {
        innerMatRef.current.color.set(configRef.current.parts.front.color);
      }

      dirtyRef.current = false;
    }, []);

    // Expose imperative methods
    useImperativeHandle(ref, () => ({
      triggerGust: () => {
        windRef.current = Math.min(4.5, windRef.current + 3.0);
      },
      rotateTo: (targetRad: number) => {
        targetRyRef.current = targetRad;
        vyRef.current = 0;
      },
      getCanvas: () => canvasRef.current,
      setRecordingQuality: (enabled: boolean) => {
        const renderer = rendererRef.current;
        const container = containerRef.current;
        recordingQualityRef.current = enabled;
        if (!renderer || !container) return;

        const { width, height } = container.getBoundingClientRect();
        if (width <= 0 || height <= 0) return;

        const pixelRatio = enabled
          ? Math.max(1, 1920 / Math.max(width, height))
          : rendererPixelRatioRef.current;
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(Math.floor(width), Math.floor(height), false);
        dirtyRef.current = true;
      },
      setAutoRotate: (auto: boolean) => {
        autoRotateRef.current = auto;
      },
      zoomIn: () => {
        userHasZoomedRef.current = true;
        targetZRef.current = Math.max(2.6, targetZRef.current - 0.75);
        triggerZoomBadge(targetZRef.current, baseDistRef.current);
        dirtyRef.current = true;
      },
      zoomOut: () => {
        userHasZoomedRef.current = true;
        targetZRef.current = Math.min(12.0, targetZRef.current + 0.75);
        triggerZoomBadge(targetZRef.current, baseDistRef.current);
        dirtyRef.current = true;
      },
      resetView: () => {
        targetRyRef.current = -0.35;
        vyRef.current = 0;
        userHasZoomedRef.current = false;
        targetZRef.current = baseDistRef.current;
        triggerZoomBadge(baseDistRef.current, baseDistRef.current);
        dirtyRef.current = true;
      },
      toggleWireframe: () => {
        isWireframeRef.current = !isWireframeRef.current;
        const wf = isWireframeRef.current;
        const mats = [
          frontMatRef.current,
          backMatRef.current,
          sleeveLeftMatRef.current,
          sleeveRightMatRef.current,
          collarMatRef.current,
          innerMatRef.current,
        ];
        mats.forEach((m) => {
          if (m) m.wireframe = wf;
        });
        return wf;
      },
      repaintNow: () => {
        repaintTextures();
      },
      exportImage: (transparent = false) => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return '';
        repaintTextures();
        const renderer = rendererRef.current;
        const scene = sceneRef.current;
        const camera = cameraRef.current;

        renderer.render(scene, camera);

        if (transparent) {
          return renderer.domElement.toDataURL('image/png');
        }

        const outCanvas = document.createElement('canvas');
        outCanvas.width = renderer.domElement.width;
        outCanvas.height = renderer.domElement.height;
        const ctx = outCanvas.getContext('2d');
        if (!ctx) return renderer.domElement.toDataURL('image/png');

        // Draw Studio Background
        const w = outCanvas.width;
        const h = outCanvas.height;
        const grad = ctx.createRadialGradient(w * 0.5, h * 0.42, 50, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
        if (configRef.current.theme === 'dark-editorial') {
          grad.addColorStop(0, '#1c1b26');
          grad.addColorStop(0.55, '#12111b');
          grad.addColorStop(1, '#09080e');
        } else if (configRef.current.theme === 'sunset') {
          grad.addColorStop(0, '#fef1eb');
          grad.addColorStop(0.55, '#f5d6c8');
          grad.addColorStop(1, '#dfb7a4');
        } else if (configRef.current.theme === 'pure-white') {
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(1, '#f1f1f5');
        } else if (configRef.current.theme === 'custom') {
          grad.addColorStop(0, configRef.current.backdropColor);
          grad.addColorStop(1, configRef.current.backdropColor);
        } else {
          // studio default clean
          grad.addColorStop(0, '#fafafc');
          grad.addColorStop(0.55, '#e9e9ee');
          grad.addColorStop(1, '#d0d0d8');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Floor shadow
        const floorGrad = ctx.createRadialGradient(w * 0.5, h * 0.86, 10, w * 0.5, h * 0.86, Math.min(w * 0.35, 300));
        floorGrad.addColorStop(0, 'rgba(0,0,0,0.35)');
        floorGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = floorGrad;
        ctx.fillRect(w * 0.1, h * 0.82, w * 0.8, 80);

        // WebGL canvas on top
        ctx.drawImage(renderer.domElement, 0, 0);

        return outCanvas.toDataURL('image/png');
      },
    }));

    // Repaint on config changes
    useEffect(() => {
      dirtyRef.current = true;
      autoRotateRef.current = config.autoRotate;
    }, [config]);

    // Sync sidebarOpen
    useEffect(() => {
      sidebarOpenRef.current = sidebarOpen;
    }, [sidebarOpen]);

    // Setup Three.js scene
    useEffect(() => {
      const domCanvas = canvasRef.current;
      if (!domCanvas) return;

      // Software WebGL check
      const isSoftwareGl = (() => {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      })();

      const renderer = new THREE.WebGLRenderer({
        canvas: domCanvas,
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
      });
      rendererRef.current = renderer;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      const rendererPixelRatio = isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2);
      rendererPixelRatioRef.current = rendererPixelRatio;
      renderer.setPixelRatio(rendererPixelRatio);

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 50);
      cameraRef.current = camera;

      // Lighting Rig: Clean studio lighting with soft highlights
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0xa5a5b2, 1.3);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
      keyLight.position.set(2.8, 4.0, 4.5);
      scene.add(keyLight);

      const softFill = new THREE.DirectionalLight(0xffffff, 0.7);
      softFill.position.set(-3.2, 1.8, -3.2);
      scene.add(softFill);

      const rimPink = new THREE.PointLight(0xf5d0fe, 0.7, 14);
      rimPink.position.set(-4.5, 1.2, -1.8);
      scene.add(rimPink);

      const rimCyan = new THREE.PointLight(0xcffafe, 0.7, 14);
      rimCyan.position.set(4.5, -1.0, -1.8);
      scene.add(rimCyan);

      // Create textures for all customizable parts
      const cvF = document.createElement('canvas');
      cvF.width = cvF.height = CANVAS_SIZE;
      cvFRef.current = cvF;

      const cvB = document.createElement('canvas');
      cvB.width = cvB.height = CANVAS_SIZE;
      cvBRef.current = cvB;

      const cvSL = document.createElement('canvas');
      cvSL.width = cvSL.height = CANVAS_SIZE;
      cvSLRef.current = cvSL;

      const cvSR = document.createElement('canvas');
      cvSR.width = cvSR.height = CANVAS_SIZE;
      cvSRRef.current = cvSR;

      const tF = new THREE.CanvasTexture(cvF);
      tF.colorSpace = THREE.SRGBColorSpace;
      tF.anisotropy = 8;
      texFRef.current = tF;

      const tB = new THREE.CanvasTexture(cvB);
      tB.colorSpace = THREE.SRGBColorSpace;
      tB.anisotropy = 8;
      texBRef.current = tB;

      const tSL = new THREE.CanvasTexture(cvSL);
      tSL.colorSpace = THREE.SRGBColorSpace;
      tSL.anisotropy = 8;
      texSLRef.current = tSL;

      const tSR = new THREE.CanvasTexture(cvSR);
      tSR.colorSpace = THREE.SRGBColorSpace;
      tSR.anisotropy = 8;
      texSRRef.current = tSR;

      paintPartTexture(cvF, 'front', configRef.current);
      paintPartTexture(cvB, 'back', configRef.current);
      paintPartTexture(cvSL, 'sleeveLeft', configRef.current);
      paintPartTexture(cvSR, 'sleeveRight', configRef.current);
      tF.needsUpdate = true;
      tB.needsUpdate = true;
      tSL.needsUpdate = true;
      tSR.needsUpdate = true;

      // Group for the 3D t-shirt
      const teeGroup = new THREE.Group();
      scene.add(teeGroup);
      teeGroupRef.current = teeGroup;
      teeGroup.position.y = -0.14;

      // Materials
      const frontMat = new THREE.MeshStandardMaterial({
        map: tF,
        roughness: 0.88,
        metalness: 0.02,
        side: THREE.FrontSide,
      });
      frontMatRef.current = frontMat;

      const backMat = new THREE.MeshStandardMaterial({
        map: tB,
        roughness: 0.88,
        metalness: 0.02,
        side: THREE.FrontSide,
      });
      backMatRef.current = backMat;

      const sleeveLeftMat = new THREE.MeshStandardMaterial({
        map: tSL,
        roughness: 0.88,
        metalness: 0.02,
        side: THREE.DoubleSide,
      });
      sleeveLeftMatRef.current = sleeveLeftMat;

      const sleeveRightMat = new THREE.MeshStandardMaterial({
        map: tSR,
        roughness: 0.88,
        metalness: 0.02,
        side: THREE.DoubleSide,
      });
      sleeveRightMatRef.current = sleeveRightMat;

      const collarMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(configRef.current.parts.collar.color),
        roughness: 0.94,
        metalness: 0.01,
        side: THREE.DoubleSide,
      });
      collarMatRef.current = collarMat;

      const innerMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(configRef.current.parts.front.color),
        roughness: 0.90,
        metalness: 0.01,
        side: THREE.DoubleSide,
      });
      innerMatRef.current = innerMat;

      // Load t-shirt / garment GLB model
      const loader = new GLTFLoader();
      loader.load(
        '/models/t_shirt.glb',
        (gltf) => {
          const model = gltf.scene;

          // 1. First scale the model
          const modelScale = 3.35;
          model.scale.set(modelScale, modelScale, modelScale);

          // 2. Straighten model: tilt forward by 11.5 degrees to eliminate the backward lean
          // so the t-shirt hangs completely straight and upright
          model.rotation.x = (11.5 * Math.PI) / 180;
          model.updateMatrixWorld(true);

          // 3. Compute bounding box and center at (0, 0, 0)
          const box = new THREE.Box3().setFromObject(model);
          const center = new THREE.Vector3();
          box.getCenter(center);
          model.position.sub(center);

          // Locate parts
          const meshFront = model.getObjectByName('Object_10') as THREE.Mesh;
          const meshBack = model.getObjectByName('Object_14') as THREE.Mesh;
          const meshCollar1 = model.getObjectByName('Object_6') as THREE.Mesh;
          const meshCollar2 = model.getObjectByName('Object_8') as THREE.Mesh;
          const meshSleeveRight = model.getObjectByName('Object_18') as THREE.Mesh;
          const meshSleeveLeft = model.getObjectByName('Object_20') as THREE.Mesh;

          // Normalize Front mesh UVs
          if (meshFront && meshFront.geometry.attributes.uv) {
            meshFront.userData.part = 'front';
            const spanFront = 703.22;
            const uvFront = meshFront.geometry.attributes.uv;
            for (let i = 0; i < uvFront.count; i++) {
              const u = uvFront.getX(i);
              const v = uvFront.getY(i);
              const normU = (u + spanFront / 2) / spanFront;
              const normV = (297.22 - v) / spanFront;
              uvFront.setXY(i, normU, normV);
            }
            uvFront.needsUpdate = true;
            meshFront.material = frontMat;
            frontMeshRef.current = meshFront;
          }

          // Normalize Back mesh UVs
          if (meshBack && meshBack.geometry.attributes.uv) {
            meshBack.userData.part = 'back';
            const spanBack = 729.04;
            const uvBack = meshBack.geometry.attributes.uv;
            for (let i = 0; i < uvBack.count; i++) {
              const u = uvBack.getX(i);
              const v = uvBack.getY(i);
              const normU = (u + spanBack / 2) / spanBack;
              const normV = (343.90 - v) / spanBack;
              uvBack.setXY(i, normU, normV);
            }
            uvBack.needsUpdate = true;
            meshBack.material = backMat;
            backMeshRef.current = meshBack;
          }

          // Assign part materials
          if (meshCollar1) {
            meshCollar1.userData.part = 'collar';
            meshCollar1.material = collarMat;
          }
          if (meshCollar2) {
            meshCollar2.userData.part = 'collar';
            meshCollar2.material = collarMat;
          }
          collarMeshesRef.current = [meshCollar1, meshCollar2].filter(Boolean) as THREE.Mesh[];

          if (meshSleeveLeft && meshSleeveLeft.geometry.attributes.uv) {
            meshSleeveLeft.userData.part = 'sleeveLeft';
            const uvSL = meshSleeveLeft.geometry.attributes.uv;
            const spanSL = 420;
            for (let i = 0; i < uvSL.count; i++) {
              const u = uvSL.getX(i);
              const v = uvSL.getY(i);
              const normU = (u + spanSL / 2) / spanSL;
              const normV = (spanSL / 2 - v) / spanSL;
              uvSL.setXY(i, normU, normV);
            }
            uvSL.needsUpdate = true;
            meshSleeveLeft.material = sleeveLeftMat;
            sleeveLeftMeshRef.current = meshSleeveLeft;
          }

          if (meshSleeveRight && meshSleeveRight.geometry.attributes.uv) {
            meshSleeveRight.userData.part = 'sleeveRight';
            const uvSR = meshSleeveRight.geometry.attributes.uv;
            const spanSR = 420;
            for (let i = 0; i < uvSR.count; i++) {
              const u = uvSR.getX(i);
              const v = uvSR.getY(i);
              const normU = (u + spanSR / 2) / spanSR;
              const normV = (spanSR / 2 - v) / spanSR;
              uvSR.setXY(i, normU, normV);
            }
            uvSR.needsUpdate = true;
            meshSleeveRight.material = sleeveRightMat;
            sleeveRightMeshRef.current = meshSleeveRight;
          }

          // Inner lining and seam edges
          const liningMeshes = ['Object_11', 'Object_12', 'Object_15', 'Object_16'];
          liningMeshes.forEach((name) => {
            const m = model.getObjectByName(name) as THREE.Mesh;
            if (m) m.material = innerMat;
          });

          // Store vertex base positions for cloth wave simulation
          const clothMeshes: THREE.Mesh[] = [];
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const m = child as THREE.Mesh;
              m.castShadow = true;
              m.receiveShadow = true;
              if (m.geometry.attributes.position) {
                m.userData.base = new Float32Array(m.geometry.attributes.position.array);
                clothMeshes.push(m);
              }
            }
          });
          clothMeshesRef.current = clothMeshes;

          teeGroup.add(model);
          dirtyRef.current = true;
        },
        undefined,
        (err) => console.error('Failed to load model:', err)
      );

      // Dynamic camera framing for responsive screens: ensure t-shirt is prominently scaled and fills the view nicely
      function computeTargetZ(w: number, h: number): number {
        const aspect = w / h;
        // On widescreen/desktop, camera should be close (z ~ 5.25) so shirt fills ~72-76% of container height
        // On narrow/mobile screens, scale camera distance smoothly based on aspect ratio so sleeves don't clip
        const distForHeight = 5.25;
        const distForWidth = 4.75 / Math.max(0.4, aspect);
        return Math.min(10.5, Math.max(distForHeight, distForWidth));
      }

      function handleResize() {
        if (!containerRef.current || !rendererRef.current || !cameraRef.current || !teeGroupRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const w = Math.max(Math.floor(rect.width), 120);
        const h = Math.max(Math.floor(rect.height), 120);

        renderer.setSize(w, h, false);
        const aspect = w / h;
        camera.aspect = aspect;

        const optimalZ = computeTargetZ(w, h);
        baseDistRef.current = optimalZ;

        const centerY = aspect < 0.85 ? -0.10 : -0.14;

        if (!userHasZoomedRef.current) {
          targetZRef.current = optimalZ;
          camera.position.set(0, centerY, optimalZ);
        } else {
          camera.position.x = 0;
          camera.position.y = centerY;
        }
        camera.lookAt(0, centerY, 0);
        camera.updateProjectionMatrix();

        teeGroup.position.y = centerY;
        dirtyRef.current = true;
      }

      const resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }
      window.addEventListener('resize', handleResize);
      handleResize();
      // Ensure layout stabilizes
      requestAnimationFrame(handleResize);

      // Raycasting for interactive direct design placement & part hovering
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      function getHit(e: PointerEvent): { part: TeePart; uv: THREE.Vector2 | null; point: THREE.Vector3 } | null {
        if (!domCanvas) return null;
        const rect = domCanvas.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const candidates: THREE.Mesh[] = [];
        if (frontMeshRef.current) candidates.push(frontMeshRef.current);
        if (backMeshRef.current) candidates.push(backMeshRef.current);
        if (sleeveLeftMeshRef.current) candidates.push(sleeveLeftMeshRef.current);
        if (sleeveRightMeshRef.current) candidates.push(sleeveRightMeshRef.current);
        collarMeshesRef.current.forEach((m) => {
          if (m) candidates.push(m);
        });

        if (candidates.length === 0) return null;

        const hits = raycaster.intersectObjects(candidates, false);
        if (hits.length > 0 && hits[0].object) {
          const mesh = hits[0].object as THREE.Mesh;
          const part = (mesh.userData.part || 'front') as TeePart;
          return {
            part,
            uv: hits[0].uv || null,
            point: hits[0].point,
          };
        }

        return null;
      }

      // Light-opacity violet highlight for hovered parts
      const violetColor = new THREE.Color('#8b5cf6');
      const blackColor = new THREE.Color(0x000000);
      const hoverEmissiveIntensity = 0.42;

      function updateHoverHighlight(newHoveredPart: TeePart | null) {
        if (hoveredPartRef.current === newHoveredPart) return;
        hoveredPartRef.current = newHoveredPart;
        onHoverPartChangeRef.current?.(newHoveredPart);

        if (frontMatRef.current) {
          const isHov = newHoveredPart === 'front';
          frontMatRef.current.emissive.copy(isHov ? violetColor : blackColor);
          frontMatRef.current.emissiveIntensity = isHov ? hoverEmissiveIntensity : 0;
        }
        if (backMatRef.current) {
          const isHov = newHoveredPart === 'back';
          backMatRef.current.emissive.copy(isHov ? violetColor : blackColor);
          backMatRef.current.emissiveIntensity = isHov ? hoverEmissiveIntensity : 0;
        }
        if (sleeveLeftMatRef.current) {
          const isHov = newHoveredPart === 'sleeveLeft';
          sleeveLeftMatRef.current.emissive.copy(isHov ? violetColor : blackColor);
          sleeveLeftMatRef.current.emissiveIntensity = isHov ? hoverEmissiveIntensity : 0;
        }
        if (sleeveRightMatRef.current) {
          const isHov = newHoveredPart === 'sleeveRight';
          sleeveRightMatRef.current.emissive.copy(isHov ? violetColor : blackColor);
          sleeveRightMatRef.current.emissiveIntensity = isHov ? hoverEmissiveIntensity : 0;
        }
        if (collarMatRef.current) {
          const isHov = newHoveredPart === 'collar';
          collarMatRef.current.emissive.copy(isHov ? violetColor : blackColor);
          collarMatRef.current.emissiveIntensity = isHov ? hoverEmissiveIntensity : 0;
        }
      }

      // Check handle hits (4 corners, rotation stem, center body)
      function checkDesignHandleHit(
        hit: { part: TeePart; uv: THREE.Vector2 | null },
        partKey: 'front' | 'back' | 'sleeveLeft' | 'sleeveRight'
      ): {
        type: 'corner' | 'rotation' | 'body';
        corner?: 'tl' | 'tr' | 'bl' | 'br';
      } | null {
        if (!hit.uv) return null;
        const design = configRef.current.parts[partKey]?.design;
        if (!design || !design.img) return null;

        const px = hit.uv.x * CANVAS_SIZE;
        const py = (1 - hit.uv.y) * CANVAS_SIZE;

        const dx = px - design.x;
        const dy = py - design.y;
        const cos = Math.cos(-design.rot);
        const sin = Math.sin(-design.rot);
        const lx = dx * cos - dy * sin;
        const ly = dx * sin + dy * cos;

        const drawW = design.w * design.sc;
        const drawH = design.h * design.sc;
        const pad = 10;
        const hw = drawW / 2 + pad;
        const hh = drawH / 2 + pad;
        const handleHitRadius = 40; // pixel hit radius on 1024 texture

        // 4 Corner Resize Nodes
        if (Math.hypot(lx - (-hw), ly - (-hh)) < handleHitRadius) return { type: 'corner', corner: 'tl' };
        if (Math.hypot(lx - hw, ly - (-hh)) < handleHitRadius) return { type: 'corner', corner: 'tr' };
        if (Math.hypot(lx - (-hw), ly - hh) < handleHitRadius) return { type: 'corner', corner: 'bl' };
        if (Math.hypot(lx - hw, ly - hh) < handleHitRadius) return { type: 'corner', corner: 'br' };

        // Top Rotation Node at (0, -hh - 34)
        if (Math.hypot(lx, ly - (-hh - 34)) < handleHitRadius) return { type: 'rotation' };

        // Graphic Interior Body
        if (Math.abs(lx) <= hw && Math.abs(ly) <= hh) return { type: 'body' };

        return null;
      }

      function onPointerDown(e: PointerEvent) {
        if (!domCanvas || e.button !== 0) return;
        domCanvas.setPointerCapture(e.pointerId);
        lastXRef.current = e.clientX;
        targetRyRef.current = null;
        onPointerActiveChange?.(true);

        activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (activePointersRef.current.size === 2) {
          const pts = Array.from(activePointersRef.current.values());
          initialPinchDistRef.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          initialPinchZRef.current = targetZRef.current;
        }

        pointerDownTimeRef.current = performance.now();
        pointerDownPosRef.current = { x: e.clientX, y: e.clientY };

        const hit = getHit(e);
        if (hit) {
          const part = hit.part;

          // Collar interaction
          if (part === 'collar') {
            onPartSelectRef.current?.('collar');
            modeRef.current = 'part_clicked';
            dragPartRef.current = 'front';
            return;
          }

          const partKey = part as 'front' | 'back' | 'sleeveLeft' | 'sleeveRight';
          const design = configRef.current.parts[partKey]?.design;

          // If active part has a design image, check for visual resize or rotate handle hits
          if (configRef.current.activePart === partKey && design && design.img) {
            const handleHit = checkDesignHandleHit(hit, partKey);
            if (handleHit?.type === 'corner') {
              modeRef.current = 'scale';
              dragPartRef.current = partKey;
              startScRef.current = design.sc;
              const px = (hit.uv?.x ?? 0.5) * CANVAS_SIZE;
              const py = (1 - (hit.uv?.y ?? 0.5)) * CANVAS_SIZE;
              startDistRef.current = Math.max(15, Math.hypot(px - design.x, py - design.y));
              startPointerPosRef.current = { x: e.clientX, y: e.clientY };
              return;
            }
            if (handleHit?.type === 'rotation') {
              modeRef.current = 'rot_design';
              dragPartRef.current = partKey;
              startRotRef.current = design.rot;
              const px = (hit.uv?.x ?? 0.5) * CANVAS_SIZE;
              const py = (1 - (hit.uv?.y ?? 0.5)) * CANVAS_SIZE;
              startAngleRef.current = Math.atan2(py - design.y, px - design.x);
              return;
            }
            if (handleHit?.type === 'body') {
              modeRef.current = 'move';
              dragPartRef.current = partKey;
              const px = (hit.uv?.x ?? 0.5) * CANVAS_SIZE;
              const py = (1 - (hit.uv?.y ?? 0.5)) * CANVAS_SIZE;
              dragOffsetRef.current = [design.x - px, design.y - py];
              return;
            }
          }

          // Part selected (either empty or outside handle)
          onPartSelectRef.current?.(part);
          modeRef.current = 'part_clicked';
          dragPartRef.current = partKey;
          return;
        }

        modeRef.current = 'rot';
      }

      function onPointerMove(e: PointerEvent) {
        if (!domCanvas) return;

        if (activePointersRef.current.has(e.pointerId)) {
          activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        }

        // Multi-touch pinch-to-zoom
        if (activePointersRef.current.size === 2 && initialPinchDistRef.current !== null) {
          const pts = Array.from(activePointersRef.current.values());
          const curDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          const pinchRatio = initialPinchDistRef.current / Math.max(10, curDist);
          targetZRef.current = Math.max(2.6, Math.min(12.0, initialPinchZRef.current * pinchRatio));
          userHasZoomedRef.current = true;
          triggerZoomBadge(targetZRef.current, baseDistRef.current);
          dirtyRef.current = true;
          return;
        }

        const speed = Math.abs(e.movementX || 0) / 14;
        windRef.current = Math.max(windRef.current, Math.min(2.0, speed));

        // 1. Hover state when not dragging
        if (modeRef.current === null) {
          const hit = getHit(e);
          updateHoverHighlight(hit?.part || null);

          if (hit) {
            if (hit.part === 'collar') {
              domCanvas.style.cursor = 'pointer';
            } else {
              const partKey = hit.part as 'front' | 'back' | 'sleeveLeft' | 'sleeveRight';
              const design = configRef.current.parts[partKey]?.design;
              if (configRef.current.activePart === partKey && design && design.img) {
                const handle = checkDesignHandleHit(hit, partKey);
                if (handle?.type === 'corner') {
                  domCanvas.style.cursor =
                    handle.corner === 'tl' || handle.corner === 'br' ? 'nwse-resize' : 'nesw-resize';
                } else if (handle?.type === 'rotation') {
                  domCanvas.style.cursor = 'grab';
                } else if (handle?.type === 'body') {
                  domCanvas.style.cursor = 'move';
                } else {
                  domCanvas.style.cursor = 'pointer';
                }
              } else {
                domCanvas.style.cursor = 'pointer';
              }
            }
          } else {
            domCanvas.style.cursor = 'default';
          }
          return;
        }

        // 2. Interactive visual corner resizing
        if (modeRef.current === 'scale') {
          const part = dragPartRef.current;
          const design = configRef.current.parts[part]?.design;
          if (design) {
            const hit = getHit(e);
            if (hit && hit.part === part && hit.uv) {
              const px = hit.uv.x * CANVAS_SIZE;
              const py = (1 - hit.uv.y) * CANVAS_SIZE;
              const curDist = Math.hypot(px - design.x, py - design.y);
              const ratio = curDist / Math.max(15, startDistRef.current);
              const newSc = Math.max(0.25, Math.min(3.2, Number((startScRef.current * ratio).toFixed(3))));
              onDesignChangeRef.current(part, { sc: newSc });
              dirtyRef.current = true;
            } else {
              // Smooth screen drag fallback
              const dx = e.clientX - startPointerPosRef.current.x;
              const dy = e.clientY - startPointerPosRef.current.y;
              const delta = (dx - dy) * 0.005;
              const newSc = Math.max(0.25, Math.min(3.2, Number((startScRef.current * (1 + delta)).toFixed(3))));
              onDesignChangeRef.current(part, { sc: newSc });
              dirtyRef.current = true;
            }
          }
        } else if (modeRef.current === 'rot_design') {
          // 3. Interactive rotation handle dragging
          const part = dragPartRef.current;
          const design = configRef.current.parts[part]?.design;
          if (design) {
            const hit = getHit(e);
            if (hit && hit.part === part && hit.uv) {
              const px = hit.uv.x * CANVAS_SIZE;
              const py = (1 - hit.uv.y) * CANVAS_SIZE;
              const curAngle = Math.atan2(py - design.y, px - design.x);
              const diff = curAngle - startAngleRef.current;
              const newRot = Number(((startRotRef.current + diff) % (Math.PI * 2)).toFixed(3));
              onDesignChangeRef.current(part, { rot: newRot });
              dirtyRef.current = true;
            }
          }
        } else if (modeRef.current === 'move') {
          // 4. Moving graphic position
          const hit = getHit(e);
          if (hit && hit.part === dragPartRef.current && hit.uv) {
            const px = hit.uv.x * CANVAS_SIZE;
            const py = (1 - hit.uv.y) * CANVAS_SIZE;
            const newX = Math.round(px + dragOffsetRef.current[0]);
            const newY = Math.round(py + dragOffsetRef.current[1]);
            onDesignChangeRef.current(dragPartRef.current, { x: newX, y: newY });
            dirtyRef.current = true;
          }
        } else if (modeRef.current === 'part_clicked') {
          // If user drags more than 6px after clicking part, smoothly transition to 3D orbit
          const moved = Math.hypot(e.clientX - pointerDownPosRef.current.x, e.clientY - pointerDownPosRef.current.y);
          if (moved > 6) {
            modeRef.current = 'rot';
            const dx = e.clientX - lastXRef.current;
            vyRef.current = dx * 0.012;
            ryRef.current += vyRef.current;
            lastXRef.current = e.clientX;
          }
        } else if (modeRef.current === 'rot') {
          // 5. 3D Model rotation
          const dx = e.clientX - lastXRef.current;
          vyRef.current = dx * 0.012;
          ryRef.current += vyRef.current;
          lastXRef.current = e.clientX;
        }
      }

      function onPointerUp(e: PointerEvent) {
        // Quick click detection for direct file upload
        if (modeRef.current === 'part_clicked') {
          const elapsed = performance.now() - pointerDownTimeRef.current;
          const moved = Math.hypot(e.clientX - pointerDownPosRef.current.x, e.clientY - pointerDownPosRef.current.y);
          if (elapsed < 350 && moved < 8) {
            const partKey = dragPartRef.current;
            const design = configRef.current.parts[partKey]?.design;
            // If empty, trigger direct file upload for this part
            if (!design || !design.img) {
              onTriggerUploadRef.current?.(partKey);
            }
          }
        }

        modeRef.current = null;
        activePointersRef.current.delete(e.pointerId);
        if (activePointersRef.current.size < 2) {
          initialPinchDistRef.current = null;
        }
        if (domCanvas) {
          try {
            domCanvas.releasePointerCapture(e.pointerId);
          } catch {
            // ignore
          }
        }
        onPointerActiveChange?.(false);
      }

      function onPointerLeave() {
        if (modeRef.current === null) {
          updateHoverHighlight(null);
          if (domCanvas) domCanvas.style.cursor = 'default';
        }
      }

      function onWheel(e: WheelEvent) {
        e.preventDefault();
        userHasZoomedRef.current = true;

        let delta = e.deltaY;
        if (e.deltaMode === 1) {
          delta *= 26; // lines
        } else if (e.deltaMode === 2) {
          delta *= 120; // page
        }

        // Support mouse wheel and trackpad pinch gestures (ctrlKey)
        const factor = e.ctrlKey ? 0.007 : 0.0024;
        const zoomDelta = delta * factor * (targetZRef.current * 0.42);

        const minZ = 2.6; // Allows close-up inspection of graphic decal, collar, stitches
        const maxZ = 12.0; // Far view boundary
        targetZRef.current = Math.max(minZ, Math.min(maxZ, targetZRef.current + zoomDelta));
        triggerZoomBadge(targetZRef.current, baseDistRef.current);
        dirtyRef.current = true;
      }

      domCanvas.addEventListener('pointerdown', onPointerDown);
      domCanvas.addEventListener('pointermove', onPointerMove);
      domCanvas.addEventListener('pointerup', onPointerUp);
      domCanvas.addEventListener('pointercancel', onPointerUp);
      domCanvas.addEventListener('pointerleave', onPointerLeave);
      domCanvas.addEventListener('wheel', onWheel, { passive: false });

      // Animation clock & loop
      const clock = new THREE.Clock();
      let animFrameId = 0;
      let lastFrameTime = performance.now();

      function afterDraw(cb: () => void) {
        const glCtx = renderer.getContext() as WebGL2RenderingContext;
        const sync = glCtx.fenceSync(glCtx.SYNC_GPU_COMMANDS_COMPLETE, 0);
        glCtx.flush();
        const poll = () => {
          const state = sync && glCtx.getSyncParameter(sync, glCtx.SYNC_STATUS);
          if (state === glCtx.UNSIGNALED) {
            animFrameId = window.setTimeout(poll, 5);
          } else {
            glCtx.deleteSync(sync);
            animFrameId = recordingQualityRef.current
              ? requestAnimationFrame(cb)
              : window.setTimeout(cb, 80);
          }
        };
        animFrameId = window.setTimeout(poll, 5);
      }

      function frame() {
        const t = clock.getElapsedTime();
        const now = performance.now();
        const deltaSeconds = Math.min((now - lastFrameTime) / 1000, 0.05);
        lastFrameTime = now;

        // Repaint textures if dirty
        if (dirtyRef.current) {
          repaintTextures();
        }

        // Smooth camera zoom dampening
        if (cameraRef.current) {
          const diffZ = targetZRef.current - camera.position.z;
          if (Math.abs(diffZ) > 0.001) {
            camera.position.z += diffZ * 0.18;
            camera.updateProjectionMatrix();
          }
        }

        // Center 3D model within the right-side viewport area
        teeGroup.position.x += (0 - teeGroup.position.x) * 0.1;

        // Rotation logic
        if (targetRyRef.current !== null) {
          const diff = targetRyRef.current - ryRef.current;
          ryRef.current += diff * 0.12;
          if (Math.abs(diff) < 0.005) {
            ryRef.current = targetRyRef.current;
            targetRyRef.current = null;
          }
        } else if (modeRef.current !== 'rot') {
          if (autoRotateRef.current) {
            ryRef.current += 0.72 * deltaSeconds;
          } else {
            ryRef.current += vyRef.current;
            vyRef.current *= 0.94;
            if (Math.abs(vyRef.current) < 0.0008) {
              ryRef.current += Math.sin(t * 0.45) * 0.0012;
            }
          }
        }

        teeGroup.rotation.y = ryRef.current;
        teeGroup.rotation.z = Math.sin(t * 0.7) * 0.018;

        // Cloth physics waving calculations
        windRef.current *= 0.985;
        const A = 0.25 + (configRef.current.windIntensity || 0) * 0.75 + windRef.current * 1.2;

        if (clothMeshesRef.current.length > 0) {
          const meshes = clothMeshesRef.current;
          for (let mIdx = 0; mIdx < meshes.length; mIdx++) {
            const m = meshes[mIdx];
            const pos = m.geometry.attributes.position;
            const base = m.userData.base as Float32Array;
            if (!base) continue;

            for (let i = 0; i < pos.count; i++) {
              const x = base[i * 3];
              const y = base[i * 3 + 1];
              const z = base[i * 3 + 2];

              // Bottom hem & sleeves have more natural fabric wave flutter
              const w = Math.max(0, Math.min(1, (0.05 - y) / 0.45));
              if (w > 0.01) {
                const wv =
                  (Math.sin(x * 14 + y * 6 - t * 3.2) * 0.010 +
                    Math.sin(x * 26 - y * 9 + t * 4.5) * 0.0035) *
                  w *
                  A;
                pos.setXYZ(i, x + wv * 0.15, y - Math.abs(wv) * 0.05, z + wv);
              }
            }
            pos.needsUpdate = true;
          }
        }

        renderer.render(scene, camera);

        if (isSoftwareGl) {
          afterDraw(frame);
        } else {
          animFrameId = requestAnimationFrame(frame);
        }
      }

      frame();

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', handleResize);
        domCanvas.removeEventListener('pointerdown', onPointerDown);
        domCanvas.removeEventListener('pointermove', onPointerMove);
        domCanvas.removeEventListener('pointerup', onPointerUp);
        domCanvas.removeEventListener('pointercancel', onPointerUp);
        domCanvas.removeEventListener('pointerleave', onPointerLeave);
        domCanvas.removeEventListener('wheel', onWheel);

        cancelAnimationFrame(animFrameId);
        clearTimeout(animFrameId);
        if (zoomBadgeTimeoutRef.current !== null) {
          clearTimeout(zoomBadgeTimeoutRef.current);
        }

        frontMat.dispose();
        backMat.dispose();
        sleeveLeftMat.dispose();
        sleeveRightMat.dispose();
        collarMat.dispose();
        innerMat.dispose();
        tF.dispose();
        tB.dispose();
        renderer.dispose();
      };
    }, [onPointerActiveChange, repaintTextures, modelUrl]);

    return (
      <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none">
        <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing touch-none" />

        {/* Floating Zoom Indicator Badge */}
        <div
          className={`absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-300 ease-out z-20 ${
            zoomBadge.visible
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-2 scale-95'
          }`}
        >
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-purple-500/30 text-white text-[11px] font-semibold shadow-xl shadow-purple-950/20">
            <span className="text-purple-400">🔍</span>
            <span>{zoomBadge.percent}%</span>
            <span className="text-gray-400 font-normal text-[10px]">Zoom</span>
          </div>
        </div>
      </div>
    );
  }
);
