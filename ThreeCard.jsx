"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function ThreeCard() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    const scene = new THREE.Scene();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(
      35,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.8, 2.5);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 0.8);
    key.position.set(5, 10, 7);
    scene.add(key);
    const rim = new THREE.PointLight(0x8b5cf6, 1.2, 6);
    rim.position.set(-1.5, 0.8, 1);
    scene.add(rim);

    // Starfield background
    const stars = new THREE.Group();
    for (let i = 0; i < 200; i++) {
      const starGeo = new THREE.SphereGeometry(0.01, 8, 8);
      const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const star = new THREE.Mesh(starGeo, starMat);
      star.position.x = (Math.random() - 0.5) * 20;
      star.position.y = (Math.random() - 0.5) * 20;
      star.position.z = (Math.random() - 0.5) * 20;
      stars.add(star);
    }
    scene.add(stars);

    // Card
    const cardWidth = 1.2;
    const cardHeight = 1.6;
    const thickness = 0.04;
    const geometry = new THREE.BoxGeometry(cardWidth, cardHeight, thickness);

    const textureLoader = new THREE.TextureLoader();
    let frontTexture = textureLoader.load("/card-image.png", (tex) => {
      tex.encoding = THREE.sRGBEncoding;
      tex.flipY = false;
    });

    const darkMat = new THREE.MeshPhysicalMaterial({
      color: 0x0d0b12,
      metalness: 0.1,
      roughness: 0.6,
      clearcoat: 0.4,
    });

    const frontMat = new THREE.MeshPhysicalMaterial({
      map: frontTexture,
      metalness: 0,
      roughness: 0.35,
      reflectivity: 0.5,
    });

    const backMat = new THREE.MeshPhysicalMaterial({
      color: 0x0d0b12,
      metalness: 0.05,
      roughness: 0.5,
    });

    const materials = [darkMat, darkMat, darkMat, darkMat, frontMat, backMat];
    const card = new THREE.Mesh(geometry, materials);
    card.rotation.x = -0.12;
    scene.add(card);

    // Glow plane
    function createGlowTexture() {
      const size = 512;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      const grd = ctx.createRadialGradient(
        size / 2,
        size / 2,
        size * 0.05,
        size / 2,
        size / 2,
        size / 2
      );
      grd.addColorStop(0, "rgba(139,92,246,0.9)");
      grd.addColorStop(0.35, "rgba(139,92,246,0.25)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, size, size);
      return new THREE.CanvasTexture(canvas);
    }

    const glowTex = createGlowTexture();
    const glowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(cardWidth * 1.8, cardHeight * 1.8),
      new THREE.MeshBasicMaterial({
        map: glowTex,
        transparent: true,
        depthWrite: false,
      })
    );
    glowPlane.position.set(0, 0, -0.12);
    scene.add(glowPlane);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = 1.2;
    controls.maxDistance = 4.5;
    controls.target.set(0, 0, 0);

    // Animation
    const clock = new THREE.Clock();
    let hovering = false;
    let targetRotX = -0.12,
      targetRotY = 0;

    const handlePointerMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const cx = (x - 0.5) * 2;
      const cy = (y - 0.5) * 2;
      targetRotY = cx * 0.35;
      targetRotX = -0.12 + cy * 0.12;
    };

    const animate = () => {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      card.position.y = Math.sin(t * 0.6) * 0.03;
      glowPlane.position.y = card.position.y;

      card.rotation.x += (targetRotX - card.rotation.x) * 0.08;
      card.rotation.y += (targetRotY - card.rotation.y) * 0.08;

      const targetScale = hovering ? 1.05 : 1.0;
      card.scale.x += (targetScale - card.scale.x) * 0.08;
      card.scale.y += (targetScale - card.scale.y) * 0.08;
      card.scale.z += (targetScale - card.scale.z) * 0.08;

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    renderer.domElement.addEventListener("pointerenter", () => {
      hovering = true;
    });
    renderer.domElement.addEventListener("pointerleave", () => {
      hovering = false;
    });
    window.addEventListener("pointermove", handlePointerMove);

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", handlePointerMove);
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: "100vh", overflow: "hidden" }}
    />
  );
}
