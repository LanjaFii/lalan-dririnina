import { initScene, animateScene, resizeRenderer } from "@/scene";

const { renderer, camera, scene } = initScene();

document.body.appendChild(renderer.domElement);
animateScene(renderer, scene, camera);

window.addEventListener("resize", () => resizeRenderer(renderer, camera));
