import "./styles.css";
import * as THREE from "three";
import { loadTextAssets, createTextMaterial } from "./Text";

global.THREE = THREE;
const createGeometry = require("three-bmfont-text");
let creditsJSON = require("./TheShiningCast.json");
creditsJSON = creditsJSON.slice(1);
console.clear();
// creditsJSON.shift();

/**
 * MENTION IN ARTICLE:
 * - In bitmap font generator. Go to font settings.
 *    - Choose font file. And tick Match char height to fontsize be chatarter size instead of height size.
 * https://www.gamedev.net/forums/topic/510060-bmfont-font-size/
 *    - Go to Export options and choose a power 2 texture height/width
 * - When using the font's info. Math.abs the fontSize.
 *       Ticking the "match char height" makes fontsize negative for an extrange reason
 *        Maybe a windows bug?
 * - DON'T forget about putting THREE.DoubleSide and transparent:true on your material

 */
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export class App {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    document.body.append(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    this.camera.position.z = 50;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d0d18);

    this.uMouse = new THREE.Uniform(new THREE.Vector2(0, 0));
    this.uTranslate = new THREE.Uniform(new THREE.Vector2(0, 0));

    this.clock = new THREE.Clock();

    this.assets = {};

    this.creditsGroup = new THREE.Group();
    this.initialY = 0;

    this.totalTriangles = 0;

    this.tick = this.tick.bind(this);
    this.onResize = this.onResize.bind(this);
    this.init = this.init.bind(this);
    this.loader = new Loader();
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.loadAssets().then(this.init);
  }
  loadAssets() {
    const loader = this.loader;
    const assets = this.assets;
    return new Promise((resolve, reject) => {
      loadTextAssets(assets, loader);

      loader.onComplete = () => {
        resolve();
      };
    });
  }
  createStandaloneCredit(title, people, height) {
    const viewSize = this.getViewSize();
    let marginBottom = viewSize.height / 8;
    let marginTop = viewSize.height / 8;
    let titleSeparation = 0.5;
    let nameMarginBottom = 0.5;
    let andMarginBottom = 0.5;
    if (height > 0) height += marginTop;

    let fontAssets = this.assets.fonts["regular"];
    let glyphsFontSize = fontAssets.font.info.size;
    let glyphsPixelsSize =
      (glyphsFontSize / viewSize.height) * window.innerHeight;

    let titlePixelSize = 16;
    let titleScale = titlePixelSize / glyphsPixelsSize;
    let namePixelSize = 41;
    let nameScale = namePixelSize / glyphsPixelsSize;
    let andPixelSize = 16;
    let andScale = andPixelSize / glyphsPixelsSize;

    let material = this.textMaterials[fontAssets.name];

    let titleMesh = this.createTextMesh(
      {
        text: title,
        align: "center",
        font: fontAssets.font,
        letterSpacing: (100 / 1000) * Math.abs(glyphsFontSize)
      },
      material
    );

    this.setScaleAndPosition(titleMesh, titleScale, {
      x: (titleMesh.geometry.layout.width / 2) * titleScale,
      y: -height - titleMesh.geometry.layout.height * titleScale
    });
    // titleMesh.scale.x = -titleScale;
    // titleMesh.scale.y = titleScale;
    // // let titleScale =
    // titleMesh.position.y +=
    //   -height - titleMesh.geometry.layout.height * titleScale;
    // titleMesh.position.x += (titleMesh.geometry.layout.width / 2) * titleScale;
    this.creditsGroup.add(titleMesh);
    let titleHeight = titleMesh.geometry.layout.height * titleScale;
    height += titleHeight + titleSeparation;
    for (let i = 0; i < people.length; i++) {
      let person = people[i];

      let nameMesh = this.createTextMesh(
        {
          text: person.name,
          align: "center",
          font: fontAssets.font,
          letterSpacing: (75 / 1000) * Math.abs(glyphsFontSize)
        },
        material
      );

      this.setScaleAndPosition(nameMesh, nameScale, {
        x: (nameMesh.geometry.layout.width / 2) * nameScale,
        y: -height + nameMesh.geometry.layout.height * nameScale
      });
      // nameMesh.scale.x = -nameScale;
      // nameMesh.scale.y = nameScale;
      // // let nameScale =
      // nameMesh.position.y +=
      //   -height + nameMesh.geometry.layout.height * nameScale;
      // nameMesh.position.x += (nameMesh.geometry.layout.width / 2) * nameScale;
      this.creditsGroup.add(nameMesh);
      let nameHeight = -titleMesh.geometry.layout.height * nameScale;
      height += nameHeight;

      // Margin after every name. Don't add it to single names, or last names
      if (people.length > 1 && i !== people.length - 1) {
        height += nameMarginBottom;
      }
      if (people.length > 1 && i === people.length - 2) {
        // Put "AND"

        let andMesh = this.createTextMesh(
          {
            text: "AND",
            align: "center",
            font: fontAssets.font,
            letterSpacing: (100 / 1000) * Math.abs(glyphsFontSize)
          },
          material
        );
        // andMesh.scale.x = -andScale;
        // andMesh.scale.y = andScale;
        // andMesh.position.y =
        //   -height + andMesh.geometry.layout.height * andScale;
        // andMesh.position.x = (andMesh.geometry.layout.width / 2) * andScale;

        this.setScaleAndPosition(andMesh, andScale, {
          x: (andMesh.geometry.layout.width / 2) * andScale,
          y: -height + andMesh.geometry.layout.height * andScale
        });

        this.creditsGroup.add(andMesh);
        let andHeight = titleMesh.geometry.layout.height * andScale;
        height +=
          -andHeight +
          andMarginBottom * 2 +
          nameMesh.geometry.layout._ascender * nameScale;
        // height += nameMesh.geometry.layout._ascender * nameScale
        // andHeight
        // andMarginBottom;
      }
    }
    return height + marginBottom;
  }
  createListCredit(title, people, height) {
    const viewSize = this.getViewSize();

    let marginBottom = 2;
    let titleSeparation = 1;
    let middlePadding = 0.5;

    let fontAssets = this.assets.fonts["regular"];
    let glyphsFontSize = fontAssets.font.info.size;
    let glyphsPixelsSize =
      (glyphsFontSize / viewSize.height) * window.innerHeight;

    let titlePixelSize = 16;
    let titleScale = titlePixelSize / glyphsPixelsSize;
    let jobPixelSize = 16;
    let jobScale = jobPixelSize / glyphsPixelsSize;
    let namePixelSize = 25;
    let nameScale = namePixelSize / glyphsPixelsSize;

    let material = this.textMaterials[fontAssets.name];

    let names = "";
    let jobs = "";
    for (let i = 0; i < people.length; i++) {
      let person = people[i];
      names += person.name + "\n";
      let credit = person.credit || person.role;
      if (credit != null) {
        credit = credit
          .split(" ")
          .map(word => capitalizeFirstLetter(word))
          .join(" ");
        jobs += credit + "\n";
      }
    }
    let titleMesh = this.createTextMesh(
      {
        text: title.toUpperCase(),
        align: "center",
        font: fontAssets.font,
        letterSpacing: (300 / 1000) * Math.abs(glyphsFontSize)
      },
      material
    );

    this.setScaleAndPosition(titleMesh, titleScale, {
      x: (titleMesh.geometry.layout.width / 2) * titleScale,
      y: -height + titleMesh.geometry.layout.height * titleScale
    });
    // titleMesh.scale.x = -titleScale;
    // titleMesh.scale.y = titleScale;
    // // let titleScale =
    // titleMesh.position.y =
    //   -height + titleMesh.geometry.layout.height * titleScale;
    // titleMesh.position.x = (titleMesh.geometry.layout.width / 2) * titleScale;
    this.creditsGroup.add(titleMesh);
    let titleHeight = titleMesh.geometry.layout.height * titleScale;
    height += -titleHeight + titleSeparation;

    let nameMesh = this.createTextMesh(
      {
        text: names.toUpperCase(),
        align: "left",
        font: fontAssets.font,
        letterSpacing: (75 / 1000) * Math.abs(glyphsFontSize)
      },
      material
    );
    this.setScaleAndPosition(nameMesh, nameScale, {
      x: middlePadding,
      y: -height + nameMesh.geometry.layout.height * nameScale
    });
    // nameMesh.scale.x = -nameScale;
    // nameMesh.scale.y = nameScale;
    // nameMesh.position.y = -height + nameMesh.geometry.layout.height * nameScale;
    // nameMesh.position.x = middlePadding;
    this.creditsGroup.add(nameMesh);
    let nameHeight = nameMesh.geometry.layout.height * nameScale;

    let jobMesh = this.createTextMesh(
      {
        text: jobs,
        align: "right",
        font: fontAssets.font,
        letterSpacing: (50 / 1000) * Math.abs(glyphsFontSize),
        lineHeight:
          fontAssets.font.common.lineHeight * (namePixelSize / jobPixelSize)
      },
      material
    );

    this.setScaleAndPosition(jobMesh, jobScale, {
      x: jobMesh.geometry.layout.width * jobScale - middlePadding,
      y: -height + nameMesh.geometry.layout.height * nameScale
    });
    // jobMesh.scale.x = -jobScale;
    // jobMesh.scale.y = jobScale;
    // // Use the name's layout to keep in baseline.
    // // After placing jobs, add name's height to height
    // jobMesh.position.y = -height + nameMesh.geometry.layout.height * nameScale;
    // jobMesh.position.x =
    //   +jobMesh.geometry.layout.width * jobScale - middlePadding;
    this.creditsGroup.add(jobMesh);
    // height += jobHeight;

    height += -nameHeight;

    return height + marginBottom;
  }
  createTextMesh(textOptions, material) {
    const geometry = createGeometry({
      font: this.assets.font,
      ...textOptions
    });

    return new THREE.Mesh(geometry, material);
  }
  setScaleAndPosition(mesh, scale, position, debug = false) {
    if (false) {
      mesh.scale.x = -scale;
      mesh.scale.y = scale;
      mesh.position.y = position.y;
      mesh.position.x = position.x;
    } else {
      let geometry = mesh.geometry;
      // geometry.scale(-scale, scale,1.);
      // geometry.computeBoundingSphere();
      // geometry.translate(position.x, position.y, 0);
      for (let i = 0; i < geometry.attributes.position.count; i++) {
        geometry.attributes.position.array[i * 2 + 0] =
          geometry.attributes.position.array[i * 2 + 0] * -scale + position.x;
        geometry.attributes.position.array[i * 2 + 1] =
          geometry.attributes.position.array[i * 2 + 1] * scale + position.y;
      }
      // if (debug) {
      //   console.log(scale, position);
      //   console.log(geometry);
      // }
      // geometry.computeBoundingSphere();
      // console.log(geometry.computeBoundingSphere)
      // console.log(geometry)
    }
  }
  createTitle(height) {
    const viewSize = this.getViewSize();

    let marginBottom = viewSize.height / 4;
    let titleMarginBottom = 0.5;
    let titlePixelSize = 95;
    let subtitlePixelSize = 25;

    let titleFontAssets = this.assets.fonts["bold"];
    let titleGlyphsFontSize = titleFontAssets.font.info.size;
    let titleGlyphsPixelsSize =
      (titleGlyphsFontSize / viewSize.height) * window.innerHeight;
    let titleScale = titlePixelSize / titleGlyphsPixelsSize;
    titleScale =
      ((titlePixelSize / window.innerHeight) * viewSize.height) /
      titleGlyphsFontSize;

    let subtitleFontAssets = this.assets.fonts["regular"];

    let subtitleGlyphsFontSize = subtitleFontAssets.font.info.size;
    let subtitleGlyphsPixelsSize =
      (subtitleGlyphsFontSize / viewSize.height) * window.innerHeight;
    let subtitleScale = subtitlePixelSize / subtitleGlyphsPixelsSize;

    let titleMaterial = this.textMaterials[titleFontAssets.name];
    let titleMesh = this.createTextMesh(
      {
        text: "THE SHINING",
        align: "center",
        font: titleFontAssets.font,
        letterSpacing: (25 / 1000) * Math.abs(titleGlyphsFontSize)
      },
      titleMaterial
    );

    this.setScaleAndPosition(
      titleMesh,
      titleScale,
      {
        x: (titleMesh.geometry.layout.width / 2) * titleScale,
        y: titleMesh.geometry.layout.capHeight * titleScale
      },
      true
    );

    this.creditsGroup.add(titleMesh);
    let titleHeight = -titleMesh.geometry.layout.capHeight * titleScale;

    height += titleHeight + titleMarginBottom;

    let subtitleMaterial = this.textMaterials[subtitleFontAssets.name];
    let subtitleMesh = this.createTextMesh(
      {
        text: "A STANLEY KUBRICK FILM",
        align: "center",
        font: subtitleFontAssets.font,
        letterSpacing: (75 / 1000) * Math.abs(subtitleGlyphsFontSize)
      },
      subtitleMaterial
    );

    this.setScaleAndPosition(subtitleMesh, subtitleScale, {
      x: (subtitleMesh.geometry.layout.width / 2) * subtitleScale,
      y: -height + subtitleMesh.geometry.layout.height * subtitleScale
    });
    this.creditsGroup.add(subtitleMesh);
    let subtitleHeight = subtitleMesh.geometry.layout.height * subtitleScale;
    height += subtitleHeight;

    height += marginBottom;
    return height;
  }
  createCredits(creditData) {
    let height = 0;

    height = this.createTitle(height);
    // return;
    creditData.forEach(job => {
      let title = job[0];
      let people = job[1];
      let itemHeight = 0;
      if (people.length < 4) {
        itemHeight = this.createStandaloneCredit(title, people, height);
      } else itemHeight = this.createListCredit(title, people, height);
      height = itemHeight;
      return;
      // return;
    });
    this.height = height;
  }
  createMaterials() {
    const textMaterials = {};
    let fontKeys = Object.keys(this.assets.fonts);
    for (let i = 0; i < fontKeys.length; i++) {
      let key = fontKeys[i];
      textMaterials[key] = createTextMaterial(this.assets.fonts[key].glyphs, {
        uMouse: this.uMouse,
        uTranslate: this.uTranslate
      });
    }
    this.textMaterials = textMaterials;
  }
  init() {
    const viewSize = this.getViewSize();
    this.createMaterials();
    this.createCredits(creditsJSON);
    this.initialY = -viewSize.height / 2 - 5;
    // this.initialY = 0.;
    this.creditsGroup.position.y += this.initialY;

    this.scene.add(this.creditsGroup);

    let fontAssets = this.assets.fonts["bold"];
    let glyphsFontSize = fontAssets.font.info.size;
    let screenFontSize = 64;
    let glyphsPixelSize =
      (glyphsFontSize / viewSize.height) * window.innerHeight;

    const scale = screenFontSize / glyphsPixelSize;
    const jobGeometry = createGeometry({
      font: fontAssets.font,
      align: "right",
      text: "0"
    });
    const nameMaterial = this.textMaterials[fontAssets.name];

    const jobMesh = new THREE.Mesh(jobGeometry, nameMaterial);
    jobMesh.scale.x = -scale;
    jobMesh.scale.y = scale;

    jobMesh.position.y = -viewSize.height / 2;
    jobMesh.position.x = jobGeometry.layout.width * scale + viewSize.width / 2;
    this.scene.add(jobMesh);
    this.jobMesh = jobMesh;

    this.tick();

    window.addEventListener("resize", this.onResize);

    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("touchmove", this.onTouchMove);
  }
  getViewSize() {
    const fovInRadians = (this.camera.fov * Math.PI) / 180;
    const height = Math.abs(
      this.camera.position.z * Math.tan(fovInRadians / 2) * 2
    );

    return { width: height * this.camera.aspect, height };
  }
  onMouseMove(ev) {
    const viewSize = this.getViewSize();
    let mouse = {
      x: (ev.clientX / window.innerWidth - 0.5) * viewSize.width,
      y: -(ev.clientY / window.innerHeight - 0.5) * viewSize.height
    };

    this.uMouse.value.set(mouse.x, mouse.y);
  }
  onTouchMove(ev) {
    this.onMouseMove(ev.touches[0]);
  }
  dispose() {
    this.disposed = true;
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("touchmove", this.onTouchMove);
  }
  updateInfo() {
    const viewSize = this.getViewSize();

    let fontAssets = this.assets.fonts["bold"];
    let glyphsFontSize = fontAssets.font.info.size;
    let screenFontSize = 64;
    let glyphsPixelSize =
      (glyphsFontSize / viewSize.height) * window.innerHeight;
    const scale = screenFontSize / glyphsPixelSize;

    this.jobMesh.geometry = createGeometry({
      font: fontAssets.font,
      align: "right",
      text: this.totalTriangles + ""
    });
    this.jobMesh.geometry.needsUpdate = true;
    this.jobMesh.position.y = -viewSize.height / 2;
    this.jobMesh.position.x =
      this.jobMesh.geometry.layout.width * scale + viewSize.width / 2;
  }
  update() {
    this.creditsGroup.position.y += 0.1;
    this.uTranslate.value.y = this.creditsGroup.position.y;
    if (this.creditsGroup.position.y > this.height - this.initialY) {
      this.creditsGroup.position.y = this.initialY;
    }
    if (this.renderer.info.render.triangles !== this.totalTriangles) {
      this.totalTriangles = this.renderer.info.render.triangles;
      this.updateInfo();
    }
  }
  render() {
    this.renderer.render(this.scene, this.camera);
  }
  tick() {
    if (this.disposed) return;
    this.render();
    this.update();
    requestAnimationFrame(this.tick);
  }
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

class Loader {
  constructor() {
    this.items = [];
    this.loaded = [];
  }
  begin(name) {
    this.items.push(name);
  }
  end(name) {
    this.loaded.push(name);
    if (this.loaded.length === this.items.length) {
      this.onComplete();
    }
  }
  onComplete() {}
}
