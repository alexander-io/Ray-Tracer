"use strict";

//CORE VARIABLES
var canvas, context, imageBuffer;

var DEBUG = false; //whether to show debug messages
var EPSILON = 0.00001; //error margins

//scene to render
var scene, camera; //etc...
var surfaces = [];

var ambientLight;
var pointLight;
var directionalLight;

//initializes the canvas and drawing buffers
function init() {
  canvas = $('#canvas')[0];
  context = canvas.getContext("2d");
  imageBuffer = context.createImageData(canvas.width, canvas.height); //buffer for pixels


  // loadSceneFile("assets/TriangleShadingTest.json");
  // loadSceneFile("assets/TriangleTest.json");
  // loadSceneFile("assets/SphereTest.json");
  loadSceneFile("assets/SphereShadingTest2.json");
}

//loads and "parses" the scene file at the given path
function loadSceneFile(filepath) {
  console.log("load scene");
  // load in the specified json file
  scene = Utils.loadJSON(filepath); //load the scene
  // console.log(scene.surfaces[0].shape);
  //TODO - set up camera
  // access the data within the scene variable, esp the camera array to find parameters for the Camera constructor
  camera = new Camera(scene.camera.eye, scene.camera.at, scene.camera.up, scene.camera.fovy, scene.camera.aspect);

  //TODO - set up surfaces
  for (var i = 0; i < scene.surfaces.length; i++) {

    // look into the scene json, access the surfaces array within
    // if the shape key has a value of "Triangle", then use the triangle constructor to make the object and push it onto stack
    if(scene.surfaces[i].shape === "Triangle")
    {
      console.log('found a trianglge')
      // surfaces.push(new Triangle(scene.surfaces[scene.surfaces[i].material].material, scene.surfaces[i].p1, scene.surfaces[i].p2, scene.surfaces[i].p3, scene.surfaces[i].name));
      surfaces.push(new Triangle(scene.materials[scene.surfaces[i].material], scene.surfaces[i].p1, scene.surfaces[i].p2, scene.surfaces[i].p3, scene.surfaces[i].name));
      // surfaces.push(1);
    }
    // if the shape key has a value of "Sphere", then use the sphere constructor to make the object and push it onto stack
    else if(scene.surfaces[i].shape === "Sphere")
    {
      console.log('found a sphere')
      surfaces.push(new Sphere(scene.materials[scene.surfaces[i].material], scene.surfaces[i].center, scene.surfaces[i].radius, scene.surfaces[i].name));
      // surfaces.push(1);
      // surfaces[i] = new Sphere(scene.surfaces[i].material, scene.surfaces[i].center, scene.surfaces[i].radius, scene.surfaces[i].name);
    }
    else {
      // surfaces.push(new Surface(scene.surfaces[i].material, scene.surfaces[i].name));
    }
  }

  // loop through lights and set them up
  for (var i = 0; i < scene.lights.length; i++) {
    // console.log('light : ', scene.lights[i])
    if (scene.lights[i].source === 'Ambient') {
      console.log('loading ambient light...')
      ambientLight = scene.lights[i]
    } else if (scene.lights[i].source === 'Point') {
      console.log('loading point light...')
      pointLight = scene.lights[i]
    } else if (scene.lights[i].source === 'Directional') {
      directionalLight = scene.lights[i]
    }
  }

  render(); //render the scene
}

//renders the scene
function render() {
  var start = Date.now(); //for logging

  // access all the pixels within the scene with a nested loop
  for(var i = 0; i < canvas.height; i++){
    for(var j = 0; j < canvas.width; j++){

      //TODO - fire a ray though each pixel
      camera.castRay(i, j);

      //TODO - calculate the intersection of that ray with the scene

      //TODO - set the pixel to be the color of that intersection (using setPixel() method)
    }
  }


  //render the pixels that have been set
  context.putImageData(imageBuffer,0,0);

  var end = Date.now(); //for logging
  $('#log').html("rendered in: "+(end-start)+"ms");
  console.log("rendered in: "+(end-start)+"ms");
}

var Camera = function(eye, at, up, fovy, aspect){

  // console.log("this is a function definition");
  // console.log("hello darkness my old friend");

  this.eye      = new THREE.Vector3(eye[0], eye[1], eye[2]);
  this.at       = new THREE.Vector3(at[0], at[1], at[2]);
  this.up       = new THREE.Vector3(up[0], up[1], up[2]);

  //wVec points backwards from the camera
  this.wVec     = new THREE.Vector3().subVectors(this.eye, this.at).normalize();
  //uVec points to the side of the camera
  this.uVec     = new THREE.Vector3().crossVectors(this.up, this.wVec).normalize();
  //vVec points upwards local to the camera
  this.vVec     = new THREE.Vector3().crossVectors(this.wVec, this.uVec).normalize();

  this.fovy     = fovy;
  this.aspect   = aspect;

  this.halfCameraHeight  = Math.tan(rad(this.fovy/2.0));
  this.halfCameraWidth   = this.halfCameraHeight * this.aspect;

  this.cameraWidth =  2 * this.halfCameraWidth;
  this.cameraHeight = 2 * this.halfCameraHeight;

  //the size of individual pixels in 3d space, to position the points for
  //the rays to pass through
  this.pixelHeight  = this.cameraHeight / (canvas.height - 1);
  this.pixelWidth   = this.cameraWidth / (canvas.width - 1);
};

Camera.prototype.castRay  = function(x, y){
  // Shirley, Ch4 : 4.3.1
  var u = (x * this.pixelWidth) - this.halfCameraWidth;
  var v = this.halfCameraHeight - (y * this.pixelHeight);

  //the u (side) component to the pixel
  var uComp = this.uVec.clone().multiplyScalar(u);
  //the v (up) component to the pixel
  var vComp = this.vVec.clone().multiplyScalar(v);
  var vSum1 = new THREE.Vector3().addVectors(uComp, vComp);

  //ray.direction
  // Shirley, Ch4 : 4.3.2
  var ray = {
    "origin"    : this.eye,
    "direction" : new THREE.Vector3().addVectors(vSum1,
                  this.wVec.clone().multiplyScalar(-1))
  };


  // console.log("ray direction : " + ray.origin);
  // var myvar = ray.direction;
  // console.log(myvar);
  if (DEBUG) {
    console.log('OUTER ray direction : ', ray.direction)
  }
  for (var i = 0; i < surfaces.length-1; i++) {

    // if (DEBUG) {
    //   console.log(surfaces[i])
    // }


    let tuple = surfaces[i].intersects(ray)
    // let color = trace(ray, surfaces[i], scene.materials, scene.lights)
    // let color = trace(ray, surfaces[i], scene.lights, tuple)
    // //
    // setPixel(x,y, color)
    if (tuple) {
      let color = trace(ray, surfaces[i], scene.lights, tuple)
      //
      setPixel(x,y, color)
    } else {
      // var color = 0;
      // let color = trace(ray, surfaces[i], scene.lights, tuple)
      var color = 0;
      setPixel(x,y, color)
    }
    // console.log(typeof  surfaces[i])
    // console.log('shape : ', scene.surfaces[i].shape)
    // console.log(surfaces[i])
    // if (scene.surfaces[i].shape === 'Triangle') {
    //   // if (surfaces[i].Triangle.prototype.intersects(ray)) {
    //   if (surfaces[i].intersects(ray)) {
    //     var color = 0;
    //     setPixelRed(x,y, color)
    //   } else {
    //     var color = 0;
    //     setPixelBlack(x,y, color)
    //   }
    // } else if (scene.surfaces[i].shape === 'Sphere') {
    //   if (surfaces[i].intersects(ray)) {
    //     var color = 0;
    //     setPixelRed(x,y, color)
    //   } else {
    //     var color = 0;
    //     setPixelBlack(x,y, color)
    //   }
    // }
  }
};

var Surface = function(mat, objname, transforms){
  // TODO
  this.mat = mat
  this.objname = objname
  this.transforms = transforms
};


var Sphere = function(mat, center, radius, objname, transforms){
  Surface.call(this, mat, objname, transforms);
  // TODO
  // this.center = THREE.Vector3(scene.surfaces[0].center[0], scene.surfaces[0].center[1], scene.surfaces[0].center[2])

  // this.center = center
  this.mat = mat
  this.center = new THREE.Vector3(center[0], center[1], center[2])
  this.radius = radius
};

Sphere.prototype.intersects = function(ray){
  // TODO
  // console.log('intersecting')
  // if (DEBUG){
  //   console.log(this.c)
  // }

  // if(DEBUG){
  //   console.log('ray origin : ', ray.origin)
  //   console.log('ray direction : ', ray.direction)
  //   console.log('sphere center : ', this.center)
  //   console.log('sphere radius : ', this.radius)
  // }

  // b^2 - 4ac
  if (DEBUG) {
    console.log('TESTING FIRST RAY DIRECTION : ', ray.direction)
  }
  // b = d dot (e-c)
  var b = new THREE.Vector3().subVectors(ray.origin, this.center)
  b = ray.direction.dot(b)
  b = b*b


  // if (DEBUG){
  //   console.log('dot b : ', b)
  // }

  // e - c
  var eSubC = new THREE.Vector3().subVectors(ray.origin, this.center)
  // if (DEBUG){
  //   console.log('(e - c) : ', eSubC)
  // }

  // (d dot d)
  var dDotD = new THREE.Vector3()
  dDotD = ray.direction.dot(ray.direction)
  // if (DEBUG){
  //   console.log('dDOtD : ', dDotD)
  // }

  // (e - c) dot (e - c)
  var eSubCdot = new THREE.Vector3()
  eSubCdot = eSubC.dot(eSubC)

  // if (DEBUG){
  //   console.log('(e - c) dot (e - c) : ', eSubCdot)
  // }

  // (e - c) dot (e - c) - radius^2
  var bigFuckingTerm = eSubCdot - (this.radius*this.radius)
  if (DEBUG){
    // console.log('ray radius : ', ray.radius)
    // console.log('big right term : ', bigFuckingTerm)
  }

  var rightTerm = dDotD*bigFuckingTerm


  // if (DEBUG){
  //   console.log(rightTerm)
  // }

  var finalTerm = b - rightTerm


  // if(DEBUG){
  //   console.log('finalTerm : ', finalTerm)
  // }

  if (finalTerm > 0){

    let plusT = (-b + (Math.sqrt(finalTerm)))/dDotD
    let minusT = (-b - (Math.sqrt(finalTerm)))/dDotD



    let intersectionPoint



    if (plusT > minusT){
      intersectionPoint = ray.direction.clone().multiplyScalar(plusT)
    } else {
      intersectionPoint = ray.direction.clone().multiplyScalar(minusT)
    }

    if (DEBUG) {
      console.log('TESTING second RAY DIRECTION : ', ray.direction)
    }


    // normal vector for a point on the sphere is the (point vector - the center) normalized
    // XXX:
    // question for professor mullen :
    // the normal vector for a point on the sphere is the (point vector - the center) normalized,
    // how can I calcualte the point vector?

    let normal = new THREE.Vector3().subVectors(ray.direction, this.center)
    normal.normalize()
    if (DEBUG){
      console.log('plus term : ', plusT)
      console.log('minus term : ', minusT)
      console.log('TESTING intersection point : ', intersectionPoint)
      console.log('TESTING surface normal : ', normal)
    }
    // if (DEBUG){
    //   console.log('normal : ', normal)
    //   console.log('intersection point, so called : ', intersectionPoint)
    // }

    let tuple = {
      normal : normal,
      ip : intersectionPoint
    }

    // if(DEBUG){
    //   console.log('tuple normal : ', tuple.normal)
    //   console.log('tuple intersectionPoint : ', tuple.ip)
    // }

    return tuple

  } else {
    return false
  }
};

var Triangle = function(mat, p1, p2, p3, objname, transforms){
  Surface.call(this, mat, objname, transforms);
  // TODO

  // this.center = new THREE.Vector3(center[0], center[1], center[2])
  this.p1 = new THREE.Vector3(p1[0], p1[1], p1[2])
  this.p2 = new THREE.Vector3(p2[0], p2[1], p2[2])
  this.p3 = new THREE.Vector3(p3[0], p3[1], p3[2])
  this.mat = mat


  console.log('made a triangle')
};

Triangle.prototype.intersects = function(ray){
  // TODO

  let a = this.p1
  let b = this.p2
  let c = this.p3

  // if(DEBUG){
  //   console.log('p1 : ', this.p1)
  //   console.log('p2 : ', this.p2)
  //   console.log('p3 : ', this.p3)
  // }

  // β
  let beta = new THREE.Matrix3().set(
    a.x - ray.origin.x, a.x - c.x, ray.direction.x,
    a.y - ray.origin.y, a.y - c.y, ray.direction.y,
    a.z - ray.origin.z, a.z - c.z, ray.direction.z
  )
  let betaDet = beta.determinant()
  // if (DEBUG) {
  //   console.log('beta : ', beta)
  //   console.log('beta determinant : ', betaDet)
  // }

  // γ
  let gamma = new THREE.Matrix3().set(
    a.x - b.x, a.x - ray.origin.x, ray.direction.x,
    a.y - b.y, a.y - ray.origin.y, ray.direction.y,
    a.z - b.z, a.z - ray.origin.z, ray.direction.z
  )
  let gammaDet = gamma.determinant()
  // if (DEBUG) {
  //   console.log('gamma : ', gamma)
  //   console.log('gamma determinant : ', gammaDet)
  // }

  // // τ
  // let tau = new THREE.Matrix3().set(
  //   a.x - b.x, a.x - c.x, ray.origin.x,
  //   a.y - b.y, a.y - c.y, ray.origin.y,
  //   a.z - b.z, a.z - c.z, ray.origin.z
  // )
  // let tauDet = tau.determinant()
  // if (DEBUG) {
  //   console.log('tau : ', tau)
  //   console.log('tau determinant: ', tauDet)
  // }

  let alpha = new THREE.Matrix3().set(
    a.x - b.x, a.x - c.x, ray.direction.x,
    a.y - b.y, a.y - c.y, ray.direction.y,
    a.z - b.z, a.z - c.z, ray.direction.z
  )
  let alphaDet = alpha.determinant()
  // if (DEBUG){
  //   console.log('alpha : ', alpha)
  //   console.log('alpha determinant : ', alphaDet)
  // }

  let betabeta = betaDet / alphaDet;
  let gammagamma = gammaDet / alphaDet;

  if (betabeta > 0 && gammagamma > 0 && (betabeta + gammagamma) < 1) {
    // normal vector for a triangle is the cross product of two edges, normalized

    // // τ
    let tau = new THREE.Matrix3().set(
      a.x - b.x, a.x - c.x, a.x - ray.origin.x,
      a.y - b.y, a.y - c.y, a.y - ray.origin.y,
      a.z - b.z, a.z - c.z, a.z - ray.origin.z
    )
    let tauDet = tau.clone().determinant()

    let finalT = tauDet / alphaDet
    // from mullen, to find surface normal
    // take 3 points
    // tmp1 = p1 - p2
    // tmp2 = p3 - p2
    // crossVectors (tmp1, tmp2)
    let normal = new THREE.Vector3().crossVectors(a, b)

    if (DEBUG){
      console.log('BEFORE ray direction : ', ray.direction)
    }

    let intersectionPoint = ray.direction.clone().normalize().multiplyScalar(finalT)
    // if (DEBUG){
    //
    //   console.log('AFTER ray direction : ', ray.direction)
    //   console.log('TESTING tau : ', tau)
    //   console.log('TESTING tauDet : ', tauDet)
    //   console.log('TESTING finalT variable: ', finalT)
    //   // console.log('TESTING ray direction : ', ray.direction)
    //   console.log('TESTING intersection point : ', intersectionPoint)
    // }

    let tuple = {
      normal : normal,
      ip : intersectionPoint
    }

    // if (DEBUG){
    //   console.log('triangle tuple : ', tuple)
    // }

    return tuple

  } else {
    return false
  }
  // let alphaInverse = new THREE.Matrix3().getInverse(alpha, true)
  // if (DEBUG) {
  //   console.log('alpha inverse : ', alpha)
  //
  // }
};

// function to implement lambertian shading model and return appropriate color
function trace(ray, surface, lights, tuple){
  // Lambertian Shading :
    // Shirley, Chp 4.5.1
    // Figure 4.12, geometry for lambertian shading

  // lambertian shading
  // L = kd*I*max(0, n dot l)

  // blinn-phong shading
  // L = kd*I*max(0, n dot l) + ks*I*max(0, n dot h)

  // VARIABLES
    // L = pixel color
    // I = intensity of the light source
    // l = unit vector pointing towards light source from surface
    // v = view direction, unit vector pointing toward the eye or camera
    // n = surface normal, unit vector perpendicular to the surface at the point where reflection is taking place

  // monolith : ambient light + diffuse component + specular component = reflected light
  // I = kaIa + kdId + ksIs, where ka + kd + ks = 1
  // ambient light : ka
    // ka * Ia
  // diffuse component : kd
    // kd * I * max(0, n dot l)
  // specular component : ks
    // ks * I * max(0, n dot h)

  /*
  XXX
  XXX
  XXX
  XXX
  questions for professor mullen :

  what is the variable Ii?
  how to calculate Ia
  how do i calculate surface normals?
    is the calculation separate for triangles and spheres?

  bottom of section 4.4.1
    the normal vector at point p is given by the gradient n = 2(p-c)

  */
  // let pointLightPosition
  // if (pointLight) {
  //   pointLightPosition = new THREE.Vector3(pointLight.position[0], pointLight.position[1], pointLight.position[2])
  // }

  let direction

  // color array to hold rgb values, index: 0, 1, 2 | R, G, B
  let color = []

  let Ia = ambientLight.color
//  reflection vector
  // let r =
  let v = new THREE.Vector3().subVectors(tuple.ip, ray.origin)
  // let Is = ()

  let Id = 0;
  let Is = 0;

  if (pointLight || directionalLight){
    let pointLightPosition = new THREE.Vector3(pointLight.position[0], pointLight.position[1], pointLight.position[2])
    // if (DEBUG) {
    //   console.log('first Id : ', Id)
    // }

    /*
    the vector l is computed by subtracting the intersection point of the ray and
    the surface from the light source position
    */
    let lima = new THREE.Vector3().subVectors(pointLightPosition, tuple.ip)
    // let lima = new THREE.Vector3().subVectors(pointLight.position, tuple.ip)
    // l.subVectors(pointLight.position, tuple.ip)

    var ll = lima
    let n = tuple.normal

    Id = lima.clone().normalize().dot(n.clone().normalize())*-1
    // if (DEBUG) {
    //   console.log('TESTING Id : ', Id)
    //   console.log('TESTING normal : ', n.clone().normalize())
    //   console.log('TESTING tuple intersection point : ', tuple.ip)
    // }

    // calc reflection
    // R = reflection = 2*(tuple.normal dot l)*N - l
    // (r dot v)^(materialShininess-epsilon)

    // |||||||||||||||||||||||||||
    let scalar = 2 * n.dot(ll)
    let rtmp = n.multiplyScalar(2)

    let r = new THREE.Vector3().subVectors(rtmp, ll)
    if (DEBUG) {
      console.log('IMPORTANT r variable : ', r)
    }
    r.normalize();
    // r.negate()
    let v = ray.direction
    // |||||||||||||||||||||||||||
    // Is = r.clone().dot(v)
    if (DEBUG) {
      console.log('FIRST IS : ', Is)
    }
    Is = Math.pow(r.clone().dot(v), (surface.mat.shininess-EPSILON))
    // Is = Math.pow(Is, (surface.mat.shininess-EPSILON))
    // Is = Math.pow(Is, 1)
    // Is = r.dot(v)
    if (DEBUG) {
      console.log('SECOND IS : ', Is)
      console.log('surface mat shininess : ', surface.mat)
      console.log('epsilon : ', EPSILON)
    }
    if (isNaN(Is)){
      Is = 0;

    } else if (Is < 0) {
      // Is *= -1
    }
    if (DEBUG) {
      console.log('ID : ', Id)
      console.log('IS : ', Is)
      console.log('IA : ', Ia)
      console.log('TESTING ray direction FINAL : ', ray.direction)
      console.log('testing r variable : ', r)
      console.log('testing v variable : ', v)
    }
  }




  // TODO:
  // find Id
  // find Is
  // if (DEBUG){
  //   console.log('id value is maintaining at  :', Id)
  // }
  for (var i = 0; i < 3; i++) {
    // color[i] = Ia[i] + surface.mat.ka[i]
    // if (DEBUG) {
    //   console.log('PRODUCT : ', surface.mat.ks[i])
    // }
    let yog1 = (Ia[i]*surface.mat.ka[i])
    let yog2 = (Id*surface.mat.kd[i])
    let yog3 = (Is*surface.mat.ks[i])
    if (DEBUG) {
      console.log('y1 : ', yog1)
      console.log('y2 : ', yog2)
      console.log('y3 : ', yog3)
    }
    color[i] = yog1+yog2+yog3
    // color[i] = (Ia[i]*surface.mat.ka[i]) + (Id*surface.mat.kd[i]) + (Is*surface.mat.ks[i])

  }

  if (DEBUG){
  //   // console.log('color length : ', color.length)
  //   console.log('point light : ', pointLight)
  //   console.log('direcitonal light : ', directionalLight)
  //   console.log('ambient light : ', ambientLight)
  //   console.log('surface material : ', surface.mat)
  //   console.log('ka : ', surface.mat.ka)
  //   console.log('kd : ', surface.mat.kd)
  //   console.log('ks : ', surface.mat.ks)
  //   console.log('Ia motherFUUFUFUFU : ', Ia)
    console.log('COLOR : ', color)
  }



  // if (DEBUG){
  //   console.log('tuple intersection point : ', tuple.ip)
  //   console.log('tuple normal : ', tuple.normal)
  // }





  return color
}

//sets the pixel at the given x,y to the given color
/**
 * Sets the pixel at the given screen coordinates to the given color
 * @param {int} x     The x-coordinate of the pixel
 * @param {int} y     The y-coordinate of the pixel
 * @param {float[3]} color A length-3 array (or a vec3) representing the color. Color values should floating point values between 0 and 1
 */
function setPixel(x, y, color){
  var i = (y*imageBuffer.width + x)*4;
  imageBuffer.data[i] = (color[0]*255) | 0;
  imageBuffer.data[i+1] = (color[1]*255) | 0;
  imageBuffer.data[i+2] = (color[2]*255) | 0;
  // imageBuffer.data[i] = (color[0]*255);
  // imageBuffer.data[i+1] = (color[1]*255);
  // imageBuffer.data[i+2] = (color[2]*255);
  imageBuffer.data[i+3] = 255; //(color[3]*255) | 0; //switch to include transparency
}

//converts degrees to radians
function rad(degrees){
  return degrees*Math.PI/180;
}

//on document load, run the application
$(document).ready(function(){
  init();
  render();

  // var filepath = 'assets/SphereTest.json';
  // loadSceneFile(filepath);
  //load and render new scene
  $('#load_scene_button').click(function(){
    var filepath = 'assets/'+$('#scene_file_input').val()+'.json';
    // var filepath = 'assets/SphereTest.json';
    loadSceneFile(filepath);
  });

  //debugging - cast a ray through the clicked pixel with DEBUG messaging on
  $('#canvas').click(function(e){
    var x = e.pageX - $('#canvas').offset().left;
    var y = e.pageY - $('#canvas').offset().top;
    DEBUG = true;
    camera.castRay(x,y); //cast a ray through the point
    DEBUG = false;
  });
});
