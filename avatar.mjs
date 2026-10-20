import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {VRMLoaderPlugin} from './vendor/three-vrm.module.js';
import {splitFirstPersonHead} from './avatar-geometry.mjs';
const X=new T.Vector3(1,0,0),Y=new T.Vector3(0,1,0),Z=new T.Vector3(0,0,1);
// Licensed pixiv sample derivative; variants are cosmetic, never gameplay stats.
export class FirstPersonAvatar{
 constructor(scene,camera){this.scene=scene;this.camera=camera;this.body=new T.Group();scene.add(this.body);this.instances={};this.current=null;this.key='';this.walk=0;this.ready=Promise.all(['male','female'].map(async sex=>{
  const loader=new GLTFLoader();loader.register(parser=>new VRMLoaderPlugin(parser));
  const gltf=await loader.loadAsync(new URL('./assets/anime.vrm',import.meta.url).href),vrm=gltf.userData.vrm,model=vrm.scene;
  vrm.humanoid.autoUpdateHumanBones=false;model.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
  // Crop long hair on the male variant. Separate loads prevent shared geometry mutation.
  if(sex==='male')model.traverse(o=>{if(!o.isMesh)return;const mats=Array.isArray(o.material)?o.material:[o.material];if(mats.some(m=>/Hair/.test(m.name))){const geo=o.geometry.clone(),pos=geo.attributes.position,local=new T.Vector3(),inv=o.matrixWorld.clone().invert(),cut=bounds.min.y+size.y*.86;for(let i=0;i<pos.count;i++){local.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);local.y=Math.max(local.y,cut);local.applyMatrix4(inv);pos.setXYZ(i,local.x,local.y,local.z)}pos.needsUpdate=true;geo.computeVertexNormals();o.geometry=geo}});
  const split=splitFirstPersonHead(model,bounds),wrapper=new T.Group();model.position.x-=center.x;model.position.z-=center.z;model.position.y-=bounds.min.y;wrapper.add(model);wrapper.scale.set(.94,1,.98).multiplyScalar(1.76/size.y);
  const materials=new Map();model.traverse(o=>{if(!o.isMesh)return;const old=Array.isArray(o.material)?o.material:[o.material];o.material=old.map(m=>{if(!materials.has(m)){const cloth=/Tops|Bottoms|Shoes/.test(m.name),tint=cloth?(sex==='male'?'#a9c7ed':'#ffbcd9'):'#ffffff';const mat=new T.MeshToonMaterial({map:m.map,color:tint,transparent:m.transparent,opacity:m.opacity,alphaTest:m.alphaTest,side:/Hair/.test(m.name)?T.DoubleSide:T.FrontSide,emissive:'#ffffff',emissiveIntensity:.06});mat.name=m.name;materials.set(m,mat)}return materials.get(m)});if(o.material.length===1)o.material=o.material[0];if(old.some(m=>/Hair|Face|Eye/.test(m.name)))o.layers.set(1);o.frustumCulled=false;});
  const bones={};for(const [key,bone]of Object.entries(vrm.humanoid.rawHumanBones)){const b=bone.node;bones[key]={bone:b,q:b.quaternion.clone(),p:b.position.clone()}}const rest=[];model.traverse(o=>{if(o.isBone)rest.push({bone:o,q:o.quaternion.clone(),p:o.position.clone()})});this.instances[sex]={model,wrapper,bones,rest,split,vrm};
 }));}
 activate(g){const a=this.instances[g.character];if(!a)return false;this.body.clear();this.body.add(a.wrapper);this.current=a;this.key=g.seed+':'+g.character;this.walk=0;return true}
 rotate(key,axis,angle){const b=this.current.bones[key]?.bone;if(!b)return;const worldAxis=axis.clone().applyQuaternion(this.body.quaternion),w=b.getWorldQuaternion(new T.Quaternion()),delta=new T.Quaternion().setFromAxisAngle(worldAxis,angle),parent=b.parent.getWorldQuaternion(new T.Quaternion()).invert();b.quaternion.copy(parent.multiply(delta.multiply(w)));b.updateMatrixWorld(true)}
 update(g,p,dt){if(this.key!==g.seed+':'+g.character&&!this.activate(g))return;const a=this.current;if(!a)return;const moving=p.moving||g.phase==='transit'&&g.transit?.kind==='stairs',running=!!p.running;this.walk+=dt*(moving?(running?11:7):1.5);const eye=g.posture==='crouch'?1.02:g.character==='female'?1.59:1.65,stair=g.phase==='transit'&&g.transit?.kind==='stairs',ground=stair?this.camera.position.y-eye:0,yaw=this.camera.rotation.y;
  this.body.position.set(this.camera.position.x+Math.sin(yaw)*.12,ground,this.camera.position.z+Math.cos(yaw)*.12);this.body.rotation.y=yaw+Math.PI;for(const {bone,q,p:position}of a.rest){bone.quaternion.copy(q);bone.position.copy(position)}const crouch=g.posture==='crouch';if(crouch)a.bones.hips.bone.position.y-=.34;this.body.updateMatrixWorld(true);
  const swing=moving?Math.sin(this.walk):0,amp=running?.62:.36;for(const [side,sign]of [['left',1],['right',-1]]){this.rotate(side+'UpperArm',Z,-sign*1.30);this.rotate(side+'UpperArm',X,-swing*sign*amp*.65);this.rotate(side+'LowerArm',Y,-sign*(running?.55:.16));this.rotate(side+'UpperLeg',X,swing*sign*amp+(crouch?-1:-.32));this.rotate(side+'LowerLeg',X,Math.max(0,swing*sign)*amp*.9+(crouch?1.7:.16));this.rotate(side+'Foot',X,-Math.max(0,swing*sign)*amp*.3)}this.rotate('head',Y,Math.sin(this.walk*.22)*.025);
  // The sample clothes use aim/roll constraints: updating only humanoid bones leaves T-pose sleeves.
  a.vrm.nodeConstraintManager?.update();this.body.updateMatrixWorld(true);const feet=['leftFoot','rightFoot'].map(k=>a.bones[k].bone.getWorldPosition(new T.Vector3()).y);this.body.position.y+=ground+.105-Math.min(...feet);this.body.updateMatrixWorld(true);this.body.visible=true;
 }
}
