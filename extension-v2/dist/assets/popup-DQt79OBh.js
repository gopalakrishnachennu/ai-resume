(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))r(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const u of o.addedNodes)u.tagName==="LINK"&&u.rel==="modulepreload"&&r(u)}).observe(document,{childList:!0,subtree:!0});function e(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function r(i){if(i.ep)return;i.ep=!0;const o=e(i);fetch(i.href,o)}})();const hc=()=>{};var Ji={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ha=function(n){const t=[];let e=0;for(let r=0;r<n.length;r++){let i=n.charCodeAt(r);i<128?t[e++]=i:i<2048?(t[e++]=i>>6|192,t[e++]=i&63|128):(i&64512)===55296&&r+1<n.length&&(n.charCodeAt(r+1)&64512)===56320?(i=65536+((i&1023)<<10)+(n.charCodeAt(++r)&1023),t[e++]=i>>18|240,t[e++]=i>>12&63|128,t[e++]=i>>6&63|128,t[e++]=i&63|128):(t[e++]=i>>12|224,t[e++]=i>>6&63|128,t[e++]=i&63|128)}return t},dc=function(n){const t=[];let e=0,r=0;for(;e<n.length;){const i=n[e++];if(i<128)t[r++]=String.fromCharCode(i);else if(i>191&&i<224){const o=n[e++];t[r++]=String.fromCharCode((i&31)<<6|o&63)}else if(i>239&&i<365){const o=n[e++],u=n[e++],l=n[e++],d=((i&7)<<18|(o&63)<<12|(u&63)<<6|l&63)-65536;t[r++]=String.fromCharCode(55296+(d>>10)),t[r++]=String.fromCharCode(56320+(d&1023))}else{const o=n[e++],u=n[e++];t[r++]=String.fromCharCode((i&15)<<12|(o&63)<<6|u&63)}}return t.join("")},da={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(n,t){if(!Array.isArray(n))throw Error("encodeByteArray takes an array as a parameter");this.init_();const e=t?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let i=0;i<n.length;i+=3){const o=n[i],u=i+1<n.length,l=u?n[i+1]:0,d=i+2<n.length,f=d?n[i+2]:0,_=o>>2,w=(o&3)<<4|l>>4;let R=(l&15)<<2|f>>6,S=f&63;d||(S=64,u||(R=64)),r.push(e[_],e[w],e[R],e[S])}return r.join("")},encodeString(n,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(n):this.encodeByteArray(ha(n),t)},decodeString(n,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(n):dc(this.decodeStringToByteArray(n,t))},decodeStringToByteArray(n,t){this.init_();const e=t?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let i=0;i<n.length;){const o=e[n.charAt(i++)],l=i<n.length?e[n.charAt(i)]:0;++i;const f=i<n.length?e[n.charAt(i)]:64;++i;const w=i<n.length?e[n.charAt(i)]:64;if(++i,o==null||l==null||f==null||w==null)throw new fc;const R=o<<2|l>>4;if(r.push(R),f!==64){const S=l<<4&240|f>>2;if(r.push(S),w!==64){const x=f<<6&192|w;r.push(x)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let n=0;n<this.ENCODED_VALS.length;n++)this.byteToCharMap_[n]=this.ENCODED_VALS.charAt(n),this.charToByteMap_[this.byteToCharMap_[n]]=n,this.byteToCharMapWebSafe_[n]=this.ENCODED_VALS_WEBSAFE.charAt(n),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[n]]=n,n>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(n)]=n,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(n)]=n)}}};class fc extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const mc=function(n){const t=ha(n);return da.encodeByteArray(t,!0)},Wn=function(n){return mc(n).replace(/\./g,"")},gc=function(n){try{return da.decodeString(n,!0)}catch(t){console.error("base64Decode failed: ",t)}return null};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function pc(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _c=()=>pc().__FIREBASE_DEFAULTS__,yc=()=>{if(typeof process>"u"||typeof Ji>"u")return;const n=Ji.__FIREBASE_DEFAULTS__;if(n)return JSON.parse(n)},Ec=()=>{if(typeof document>"u")return;let n;try{n=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const t=n&&gc(n[1]);return t&&JSON.parse(t)},ws=()=>{try{return hc()||_c()||yc()||Ec()}catch(n){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${n}`);return}},Tc=n=>{var t,e;return(e=(t=ws())==null?void 0:t.emulatorHosts)==null?void 0:e[n]},Ic=n=>{const t=Tc(n);if(!t)return;const e=t.lastIndexOf(":");if(e<=0||e+1===t.length)throw new Error(`Invalid host ${t} with no separate hostname and port!`);const r=parseInt(t.substring(e+1),10);return t[0]==="["?[t.substring(1,e-1),r]:[t.substring(0,e),r]},fa=()=>{var n;return(n=ws())==null?void 0:n.config};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vc{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((t,e)=>{this.resolve=t,this.reject=e})}wrapCallback(t){return(e,r)=>{e?this.reject(e):this.resolve(r),typeof t=="function"&&(this.promise.catch(()=>{}),t.length===1?t(e):t(e,r))}}}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function As(n){try{return(n.startsWith("http://")||n.startsWith("https://")?new URL(n).hostname:n).endsWith(".cloudworkstations.dev")}catch{return!1}}async function wc(n){return(await fetch(n,{credentials:"include"})).ok}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ac(n,t){if(n.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const e={alg:"none",type:"JWT"},r=t||"demo-project",i=n.iat||0,o=n.sub||n.user_id;if(!o)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const u={iss:`https://securetoken.google.com/${r}`,aud:r,iat:i,exp:i+3600,auth_time:i,sub:o,user_id:o,firebase:{sign_in_provider:"custom",identities:{}},...n};return[Wn(JSON.stringify(e)),Wn(JSON.stringify(u)),""].join(".")}const rn={};function Rc(){const n={prod:[],emulator:[]};for(const t of Object.keys(rn))rn[t]?n.emulator.push(t):n.prod.push(t);return n}function Cc(n){let t=document.getElementById(n),e=!1;return t||(t=document.createElement("div"),t.setAttribute("id",n),e=!0),{created:e,element:t}}let Zi=!1;function Sc(n,t){if(typeof window>"u"||typeof document>"u"||!As(window.location.host)||rn[n]===t||rn[n]||Zi)return;rn[n]=t;function e(R){return`__firebase__banner__${R}`}const r="__firebase__banner",o=Rc().prod.length>0;function u(){const R=document.getElementById(r);R&&R.remove()}function l(R){R.style.display="flex",R.style.background="#7faaf0",R.style.position="fixed",R.style.bottom="5px",R.style.left="5px",R.style.padding=".5em",R.style.borderRadius="5px",R.style.alignItems="center"}function d(R,S){R.setAttribute("width","24"),R.setAttribute("id",S),R.setAttribute("height","24"),R.setAttribute("viewBox","0 0 24 24"),R.setAttribute("fill","none"),R.style.marginLeft="-6px"}function f(){const R=document.createElement("span");return R.style.cursor="pointer",R.style.marginLeft="16px",R.style.fontSize="24px",R.innerHTML=" &times;",R.onclick=()=>{Zi=!0,u()},R}function _(R,S){R.setAttribute("id",S),R.innerText="Learn more",R.href="https://firebase.google.com/docs/studio/preview-apps#preview-backend",R.setAttribute("target","__blank"),R.style.paddingLeft="5px",R.style.textDecoration="underline"}function w(){const R=Cc(r),S=e("text"),x=document.getElementById(S)||document.createElement("span"),O=e("learnmore"),D=document.getElementById(O)||document.createElement("a"),X=e("preprendIcon"),z=document.getElementById(X)||document.createElementNS("http://www.w3.org/2000/svg","svg");if(R.created){const G=R.element;l(G),_(D,O);const at=f();d(z,X),G.append(z,x,D,at),document.body.appendChild(G)}o?(x.innerText="Preview backend disconnected.",z.innerHTML=`<g clip-path="url(#clip0_6013_33858)">
<path d="M4.8 17.6L12 5.6L19.2 17.6H4.8ZM6.91667 16.4H17.0833L12 7.93333L6.91667 16.4ZM12 15.6C12.1667 15.6 12.3056 15.5444 12.4167 15.4333C12.5389 15.3111 12.6 15.1667 12.6 15C12.6 14.8333 12.5389 14.6944 12.4167 14.5833C12.3056 14.4611 12.1667 14.4 12 14.4C11.8333 14.4 11.6889 14.4611 11.5667 14.5833C11.4556 14.6944 11.4 14.8333 11.4 15C11.4 15.1667 11.4556 15.3111 11.5667 15.4333C11.6889 15.5444 11.8333 15.6 12 15.6ZM11.4 13.6H12.6V10.4H11.4V13.6Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6013_33858">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`):(z.innerHTML=`<g clip-path="url(#clip0_6083_34804)">
<path d="M11.4 15.2H12.6V11.2H11.4V15.2ZM12 10C12.1667 10 12.3056 9.94444 12.4167 9.83333C12.5389 9.71111 12.6 9.56667 12.6 9.4C12.6 9.23333 12.5389 9.09444 12.4167 8.98333C12.3056 8.86111 12.1667 8.8 12 8.8C11.8333 8.8 11.6889 8.86111 11.5667 8.98333C11.4556 9.09444 11.4 9.23333 11.4 9.4C11.4 9.56667 11.4556 9.71111 11.5667 9.83333C11.6889 9.94444 11.8333 10 12 10ZM12 18.4C11.1222 18.4 10.2944 18.2333 9.51667 17.9C8.73889 17.5667 8.05556 17.1111 7.46667 16.5333C6.88889 15.9444 6.43333 15.2611 6.1 14.4833C5.76667 13.7056 5.6 12.8778 5.6 12C5.6 11.1111 5.76667 10.2833 6.1 9.51667C6.43333 8.73889 6.88889 8.06111 7.46667 7.48333C8.05556 6.89444 8.73889 6.43333 9.51667 6.1C10.2944 5.76667 11.1222 5.6 12 5.6C12.8889 5.6 13.7167 5.76667 14.4833 6.1C15.2611 6.43333 15.9389 6.89444 16.5167 7.48333C17.1056 8.06111 17.5667 8.73889 17.9 9.51667C18.2333 10.2833 18.4 11.1111 18.4 12C18.4 12.8778 18.2333 13.7056 17.9 14.4833C17.5667 15.2611 17.1056 15.9444 16.5167 16.5333C15.9389 17.1111 15.2611 17.5667 14.4833 17.9C13.7167 18.2333 12.8889 18.4 12 18.4ZM12 17.2C13.4444 17.2 14.6722 16.6944 15.6833 15.6833C16.6944 14.6722 17.2 13.4444 17.2 12C17.2 10.5556 16.6944 9.32778 15.6833 8.31667C14.6722 7.30555 13.4444 6.8 12 6.8C10.5556 6.8 9.32778 7.30555 8.31667 8.31667C7.30556 9.32778 6.8 10.5556 6.8 12C6.8 13.4444 7.30556 14.6722 8.31667 15.6833C9.32778 16.6944 10.5556 17.2 12 17.2Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6083_34804">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`,x.innerText="Preview backend running in this workspace."),x.setAttribute("id",S)}document.readyState==="loading"?window.addEventListener("DOMContentLoaded",w):w()}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Pc(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function bc(){var t;const n=(t=ws())==null?void 0:t.forceEnvironment;if(n==="node")return!0;if(n==="browser")return!1;try{return Object.prototype.toString.call(global.process)==="[object process]"}catch{return!1}}function Vc(){return!bc()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function Dc(){try{return typeof indexedDB=="object"}catch{return!1}}function Nc(){return new Promise((n,t)=>{try{let e=!0;const r="validate-browser-context-for-indexeddb-analytics-module",i=self.indexedDB.open(r);i.onsuccess=()=>{i.result.close(),e||self.indexedDB.deleteDatabase(r),n(!0)},i.onupgradeneeded=()=>{e=!1},i.onerror=()=>{var o;t(((o=i.error)==null?void 0:o.message)||"")}}catch(e){t(e)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const kc="FirebaseError";class ke extends Error{constructor(t,e,r){super(e),this.code=t,this.customData=r,this.name=kc,Object.setPrototypeOf(this,ke.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,ma.prototype.create)}}class ma{constructor(t,e,r){this.service=t,this.serviceName=e,this.errors=r}create(t,...e){const r=e[0]||{},i=`${this.service}/${t}`,o=this.errors[t],u=o?xc(o,r):"Error",l=`${this.serviceName}: ${u} (${i}).`;return new ke(i,l,r)}}function xc(n,t){return n.replace(Oc,(e,r)=>{const i=t[r];return i!=null?String(i):`<${r}?>`})}const Oc=/\{\$([^}]+)}/g;function Xn(n,t){if(n===t)return!0;const e=Object.keys(n),r=Object.keys(t);for(const i of e){if(!r.includes(i))return!1;const o=n[i],u=t[i];if(to(o)&&to(u)){if(!Xn(o,u))return!1}else if(o!==u)return!1}for(const i of r)if(!e.includes(i))return!1;return!0}function to(n){return n!==null&&typeof n=="object"}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Mc(n){return n&&n._delegate?n._delegate:n}class ln{constructor(t,e,r){this.name=t,this.instanceFactory=e,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(t){return this.instantiationMode=t,this}setMultipleInstances(t){return this.multipleInstances=t,this}setServiceProps(t){return this.serviceProps=t,this}setInstanceCreatedCallback(t){return this.onInstanceCreated=t,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ae="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Lc{constructor(t,e){this.name=t,this.container=e,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(t){const e=this.normalizeInstanceIdentifier(t);if(!this.instancesDeferred.has(e)){const r=new vc;if(this.instancesDeferred.set(e,r),this.isInitialized(e)||this.shouldAutoInitialize())try{const i=this.getOrInitializeService({instanceIdentifier:e});i&&r.resolve(i)}catch{}}return this.instancesDeferred.get(e).promise}getImmediate(t){const e=this.normalizeInstanceIdentifier(t==null?void 0:t.identifier),r=(t==null?void 0:t.optional)??!1;if(this.isInitialized(e)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:e})}catch(i){if(r)return null;throw i}else{if(r)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(t){if(t.name!==this.name)throw Error(`Mismatching Component ${t.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=t,!!this.shouldAutoInitialize()){if(Uc(t))try{this.getOrInitializeService({instanceIdentifier:ae})}catch{}for(const[e,r]of this.instancesDeferred.entries()){const i=this.normalizeInstanceIdentifier(e);try{const o=this.getOrInitializeService({instanceIdentifier:i});r.resolve(o)}catch{}}}}clearInstance(t=ae){this.instancesDeferred.delete(t),this.instancesOptions.delete(t),this.instances.delete(t)}async delete(){const t=Array.from(this.instances.values());await Promise.all([...t.filter(e=>"INTERNAL"in e).map(e=>e.INTERNAL.delete()),...t.filter(e=>"_delete"in e).map(e=>e._delete())])}isComponentSet(){return this.component!=null}isInitialized(t=ae){return this.instances.has(t)}getOptions(t=ae){return this.instancesOptions.get(t)||{}}initialize(t={}){const{options:e={}}=t,r=this.normalizeInstanceIdentifier(t.instanceIdentifier);if(this.isInitialized(r))throw Error(`${this.name}(${r}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const i=this.getOrInitializeService({instanceIdentifier:r,options:e});for(const[o,u]of this.instancesDeferred.entries()){const l=this.normalizeInstanceIdentifier(o);r===l&&u.resolve(i)}return i}onInit(t,e){const r=this.normalizeInstanceIdentifier(e),i=this.onInitCallbacks.get(r)??new Set;i.add(t),this.onInitCallbacks.set(r,i);const o=this.instances.get(r);return o&&t(o,r),()=>{i.delete(t)}}invokeOnInitCallbacks(t,e){const r=this.onInitCallbacks.get(e);if(r)for(const i of r)try{i(t,e)}catch{}}getOrInitializeService({instanceIdentifier:t,options:e={}}){let r=this.instances.get(t);if(!r&&this.component&&(r=this.component.instanceFactory(this.container,{instanceIdentifier:Fc(t),options:e}),this.instances.set(t,r),this.instancesOptions.set(t,e),this.invokeOnInitCallbacks(r,t),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,t,r)}catch{}return r||null}normalizeInstanceIdentifier(t=ae){return this.component?this.component.multipleInstances?t:ae:t}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function Fc(n){return n===ae?void 0:n}function Uc(n){return n.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bc{constructor(t){this.name=t,this.providers=new Map}addComponent(t){const e=this.getProvider(t.name);if(e.isComponentSet())throw new Error(`Component ${t.name} has already been registered with ${this.name}`);e.setComponent(t)}addOrOverwriteComponent(t){this.getProvider(t.name).isComponentSet()&&this.providers.delete(t.name),this.addComponent(t)}getProvider(t){if(this.providers.has(t))return this.providers.get(t);const e=new Lc(t,this);return this.providers.set(t,e),e}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var j;(function(n){n[n.DEBUG=0]="DEBUG",n[n.VERBOSE=1]="VERBOSE",n[n.INFO=2]="INFO",n[n.WARN=3]="WARN",n[n.ERROR=4]="ERROR",n[n.SILENT=5]="SILENT"})(j||(j={}));const jc={debug:j.DEBUG,verbose:j.VERBOSE,info:j.INFO,warn:j.WARN,error:j.ERROR,silent:j.SILENT},qc=j.INFO,$c={[j.DEBUG]:"log",[j.VERBOSE]:"log",[j.INFO]:"info",[j.WARN]:"warn",[j.ERROR]:"error"},zc=(n,t,...e)=>{if(t<n.logLevel)return;const r=new Date().toISOString(),i=$c[t];if(i)console[i](`[${r}]  ${n.name}:`,...e);else throw new Error(`Attempted to log a message with an invalid logType (value: ${t})`)};class ga{constructor(t){this.name=t,this._logLevel=qc,this._logHandler=zc,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(t){if(!(t in j))throw new TypeError(`Invalid value "${t}" assigned to \`logLevel\``);this._logLevel=t}setLogLevel(t){this._logLevel=typeof t=="string"?jc[t]:t}get logHandler(){return this._logHandler}set logHandler(t){if(typeof t!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=t}get userLogHandler(){return this._userLogHandler}set userLogHandler(t){this._userLogHandler=t}debug(...t){this._userLogHandler&&this._userLogHandler(this,j.DEBUG,...t),this._logHandler(this,j.DEBUG,...t)}log(...t){this._userLogHandler&&this._userLogHandler(this,j.VERBOSE,...t),this._logHandler(this,j.VERBOSE,...t)}info(...t){this._userLogHandler&&this._userLogHandler(this,j.INFO,...t),this._logHandler(this,j.INFO,...t)}warn(...t){this._userLogHandler&&this._userLogHandler(this,j.WARN,...t),this._logHandler(this,j.WARN,...t)}error(...t){this._userLogHandler&&this._userLogHandler(this,j.ERROR,...t),this._logHandler(this,j.ERROR,...t)}}const Hc=(n,t)=>t.some(e=>n instanceof e);let eo,no;function Gc(){return eo||(eo=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function Kc(){return no||(no=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const pa=new WeakMap,Zr=new WeakMap,_a=new WeakMap,Br=new WeakMap,Rs=new WeakMap;function Qc(n){const t=new Promise((e,r)=>{const i=()=>{n.removeEventListener("success",o),n.removeEventListener("error",u)},o=()=>{e(zt(n.result)),i()},u=()=>{r(n.error),i()};n.addEventListener("success",o),n.addEventListener("error",u)});return t.then(e=>{e instanceof IDBCursor&&pa.set(e,n)}).catch(()=>{}),Rs.set(t,n),t}function Wc(n){if(Zr.has(n))return;const t=new Promise((e,r)=>{const i=()=>{n.removeEventListener("complete",o),n.removeEventListener("error",u),n.removeEventListener("abort",u)},o=()=>{e(),i()},u=()=>{r(n.error||new DOMException("AbortError","AbortError")),i()};n.addEventListener("complete",o),n.addEventListener("error",u),n.addEventListener("abort",u)});Zr.set(n,t)}let ts={get(n,t,e){if(n instanceof IDBTransaction){if(t==="done")return Zr.get(n);if(t==="objectStoreNames")return n.objectStoreNames||_a.get(n);if(t==="store")return e.objectStoreNames[1]?void 0:e.objectStore(e.objectStoreNames[0])}return zt(n[t])},set(n,t,e){return n[t]=e,!0},has(n,t){return n instanceof IDBTransaction&&(t==="done"||t==="store")?!0:t in n}};function Xc(n){ts=n(ts)}function Yc(n){return n===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(t,...e){const r=n.call(jr(this),t,...e);return _a.set(r,t.sort?t.sort():[t]),zt(r)}:Kc().includes(n)?function(...t){return n.apply(jr(this),t),zt(pa.get(this))}:function(...t){return zt(n.apply(jr(this),t))}}function Jc(n){return typeof n=="function"?Yc(n):(n instanceof IDBTransaction&&Wc(n),Hc(n,Gc())?new Proxy(n,ts):n)}function zt(n){if(n instanceof IDBRequest)return Qc(n);if(Br.has(n))return Br.get(n);const t=Jc(n);return t!==n&&(Br.set(n,t),Rs.set(t,n)),t}const jr=n=>Rs.get(n);function Zc(n,t,{blocked:e,upgrade:r,blocking:i,terminated:o}={}){const u=indexedDB.open(n,t),l=zt(u);return r&&u.addEventListener("upgradeneeded",d=>{r(zt(u.result),d.oldVersion,d.newVersion,zt(u.transaction),d)}),e&&u.addEventListener("blocked",d=>e(d.oldVersion,d.newVersion,d)),l.then(d=>{o&&d.addEventListener("close",()=>o()),i&&d.addEventListener("versionchange",f=>i(f.oldVersion,f.newVersion,f))}).catch(()=>{}),l}const tl=["get","getKey","getAll","getAllKeys","count"],el=["put","add","delete","clear"],qr=new Map;function ro(n,t){if(!(n instanceof IDBDatabase&&!(t in n)&&typeof t=="string"))return;if(qr.get(t))return qr.get(t);const e=t.replace(/FromIndex$/,""),r=t!==e,i=el.includes(e);if(!(e in(r?IDBIndex:IDBObjectStore).prototype)||!(i||tl.includes(e)))return;const o=async function(u,...l){const d=this.transaction(u,i?"readwrite":"readonly");let f=d.store;return r&&(f=f.index(l.shift())),(await Promise.all([f[e](...l),i&&d.done]))[0]};return qr.set(t,o),o}Xc(n=>({...n,get:(t,e,r)=>ro(t,e)||n.get(t,e,r),has:(t,e)=>!!ro(t,e)||n.has(t,e)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nl{constructor(t){this.container=t}getPlatformInfoString(){return this.container.getProviders().map(e=>{if(rl(e)){const r=e.getImmediate();return`${r.library}/${r.version}`}else return null}).filter(e=>e).join(" ")}}function rl(n){const t=n.getComponent();return(t==null?void 0:t.type)==="VERSION"}const es="@firebase/app",so="0.14.6";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const xt=new ga("@firebase/app"),sl="@firebase/app-compat",il="@firebase/analytics-compat",ol="@firebase/analytics",al="@firebase/app-check-compat",ul="@firebase/app-check",cl="@firebase/auth",ll="@firebase/auth-compat",hl="@firebase/database",dl="@firebase/data-connect",fl="@firebase/database-compat",ml="@firebase/functions",gl="@firebase/functions-compat",pl="@firebase/installations",_l="@firebase/installations-compat",yl="@firebase/messaging",El="@firebase/messaging-compat",Tl="@firebase/performance",Il="@firebase/performance-compat",vl="@firebase/remote-config",wl="@firebase/remote-config-compat",Al="@firebase/storage",Rl="@firebase/storage-compat",Cl="@firebase/firestore",Sl="@firebase/ai",Pl="@firebase/firestore-compat",bl="firebase",Vl="12.6.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ns="[DEFAULT]",Dl={[es]:"fire-core",[sl]:"fire-core-compat",[ol]:"fire-analytics",[il]:"fire-analytics-compat",[ul]:"fire-app-check",[al]:"fire-app-check-compat",[cl]:"fire-auth",[ll]:"fire-auth-compat",[hl]:"fire-rtdb",[dl]:"fire-data-connect",[fl]:"fire-rtdb-compat",[ml]:"fire-fn",[gl]:"fire-fn-compat",[pl]:"fire-iid",[_l]:"fire-iid-compat",[yl]:"fire-fcm",[El]:"fire-fcm-compat",[Tl]:"fire-perf",[Il]:"fire-perf-compat",[vl]:"fire-rc",[wl]:"fire-rc-compat",[Al]:"fire-gcs",[Rl]:"fire-gcs-compat",[Cl]:"fire-fst",[Pl]:"fire-fst-compat",[Sl]:"fire-vertex","fire-js":"fire-js",[bl]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const hn=new Map,Nl=new Map,rs=new Map;function io(n,t){try{n.container.addComponent(t)}catch(e){xt.debug(`Component ${t.name} failed to register with FirebaseApp ${n.name}`,e)}}function Yn(n){const t=n.name;if(rs.has(t))return xt.debug(`There were multiple attempts to register component ${t}.`),!1;rs.set(t,n);for(const e of hn.values())io(e,n);for(const e of Nl.values())io(e,n);return!0}function kl(n,t){const e=n.container.getProvider("heartbeat").getImmediate({optional:!0});return e&&e.triggerHeartbeat(),n.container.getProvider(t)}function xl(n){return n==null?!1:n.settings!==void 0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ol={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},Ht=new ma("app","Firebase",Ol);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ml{constructor(t,e,r){this._isDeleted=!1,this._options={...t},this._config={...e},this._name=e.name,this._automaticDataCollectionEnabled=e.automaticDataCollectionEnabled,this._container=r,this.container.addComponent(new ln("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(t){this.checkDestroyed(),this._automaticDataCollectionEnabled=t}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(t){this._isDeleted=t}checkDestroyed(){if(this.isDeleted)throw Ht.create("app-deleted",{appName:this._name})}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ll=Vl;function ya(n,t={}){let e=n;typeof t!="object"&&(t={name:t});const r={name:ns,automaticDataCollectionEnabled:!0,...t},i=r.name;if(typeof i!="string"||!i)throw Ht.create("bad-app-name",{appName:String(i)});if(e||(e=fa()),!e)throw Ht.create("no-options");const o=hn.get(i);if(o){if(Xn(e,o.options)&&Xn(r,o.config))return o;throw Ht.create("duplicate-app",{appName:i})}const u=new Bc(i);for(const d of rs.values())u.addComponent(d);const l=new Ml(e,r,u);return hn.set(i,l),l}function Fl(n=ns){const t=hn.get(n);if(!t&&n===ns&&fa())return ya();if(!t)throw Ht.create("no-app",{appName:n});return t}function oo(){return Array.from(hn.values())}function we(n,t,e){let r=Dl[n]??n;e&&(r+=`-${e}`);const i=r.match(/\s|\//),o=t.match(/\s|\//);if(i||o){const u=[`Unable to register library "${r}" with version "${t}":`];i&&u.push(`library name "${r}" contains illegal characters (whitespace or "/")`),i&&o&&u.push("and"),o&&u.push(`version name "${t}" contains illegal characters (whitespace or "/")`),xt.warn(u.join(" "));return}Yn(new ln(`${r}-version`,()=>({library:r,version:t}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ul="firebase-heartbeat-database",Bl=1,dn="firebase-heartbeat-store";let $r=null;function Ea(){return $r||($r=Zc(Ul,Bl,{upgrade:(n,t)=>{switch(t){case 0:try{n.createObjectStore(dn)}catch(e){console.warn(e)}}}}).catch(n=>{throw Ht.create("idb-open",{originalErrorMessage:n.message})})),$r}async function jl(n){try{const e=(await Ea()).transaction(dn),r=await e.objectStore(dn).get(Ta(n));return await e.done,r}catch(t){if(t instanceof ke)xt.warn(t.message);else{const e=Ht.create("idb-get",{originalErrorMessage:t==null?void 0:t.message});xt.warn(e.message)}}}async function ao(n,t){try{const r=(await Ea()).transaction(dn,"readwrite");await r.objectStore(dn).put(t,Ta(n)),await r.done}catch(e){if(e instanceof ke)xt.warn(e.message);else{const r=Ht.create("idb-set",{originalErrorMessage:e==null?void 0:e.message});xt.warn(r.message)}}}function Ta(n){return`${n.name}!${n.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ql=1024,$l=30;class zl{constructor(t){this.container=t,this._heartbeatsCache=null;const e=this.container.getProvider("app").getImmediate();this._storage=new Gl(e),this._heartbeatsCachePromise=this._storage.read().then(r=>(this._heartbeatsCache=r,r))}async triggerHeartbeat(){var t,e;try{const i=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),o=uo();if(((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===o||this._heartbeatsCache.heartbeats.some(u=>u.date===o))return;if(this._heartbeatsCache.heartbeats.push({date:o,agent:i}),this._heartbeatsCache.heartbeats.length>$l){const u=Kl(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(u,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(r){xt.warn(r)}}async getHeartbeatsHeader(){var t;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const e=uo(),{heartbeatsToSend:r,unsentEntries:i}=Hl(this._heartbeatsCache.heartbeats),o=Wn(JSON.stringify({version:2,heartbeats:r}));return this._heartbeatsCache.lastSentHeartbeatDate=e,i.length>0?(this._heartbeatsCache.heartbeats=i,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),o}catch(e){return xt.warn(e),""}}}function uo(){return new Date().toISOString().substring(0,10)}function Hl(n,t=ql){const e=[];let r=n.slice();for(const i of n){const o=e.find(u=>u.agent===i.agent);if(o){if(o.dates.push(i.date),co(e)>t){o.dates.pop();break}}else if(e.push({agent:i.agent,dates:[i.date]}),co(e)>t){e.pop();break}r=r.slice(1)}return{heartbeatsToSend:e,unsentEntries:r}}class Gl{constructor(t){this.app=t,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Dc()?Nc().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const e=await jl(this.app);return e!=null&&e.heartbeats?e:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(t){if(await this._canUseIndexedDBPromise){const r=await this.read();return ao(this.app,{lastSentHeartbeatDate:t.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:t.heartbeats})}else return}async add(t){if(await this._canUseIndexedDBPromise){const r=await this.read();return ao(this.app,{lastSentHeartbeatDate:t.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:[...r.heartbeats,...t.heartbeats]})}else return}}function co(n){return Wn(JSON.stringify({version:2,heartbeats:n})).length}function Kl(n){if(n.length===0)return-1;let t=0,e=n[0].date;for(let r=1;r<n.length;r++)n[r].date<e&&(e=n[r].date,t=r);return t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ql(n){Yn(new ln("platform-logger",t=>new nl(t),"PRIVATE")),Yn(new ln("heartbeat",t=>new zl(t),"PRIVATE")),we(es,so,n),we(es,so,"esm2020"),we("fire-js","")}Ql("");var Wl="firebase",Xl="12.6.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */we(Wl,Xl,"app");var lo=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Gt,Ia;(function(){var n;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function t(E,m){function p(){}p.prototype=m.prototype,E.F=m.prototype,E.prototype=new p,E.prototype.constructor=E,E.D=function(T,y,v){for(var g=Array(arguments.length-2),Tt=2;Tt<arguments.length;Tt++)g[Tt-2]=arguments[Tt];return m.prototype[y].apply(T,g)}}function e(){this.blockSize=-1}function r(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.C=Array(this.blockSize),this.o=this.h=0,this.u()}t(r,e),r.prototype.u=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function i(E,m,p){p||(p=0);const T=Array(16);if(typeof m=="string")for(var y=0;y<16;++y)T[y]=m.charCodeAt(p++)|m.charCodeAt(p++)<<8|m.charCodeAt(p++)<<16|m.charCodeAt(p++)<<24;else for(y=0;y<16;++y)T[y]=m[p++]|m[p++]<<8|m[p++]<<16|m[p++]<<24;m=E.g[0],p=E.g[1],y=E.g[2];let v=E.g[3],g;g=m+(v^p&(y^v))+T[0]+3614090360&4294967295,m=p+(g<<7&4294967295|g>>>25),g=v+(y^m&(p^y))+T[1]+3905402710&4294967295,v=m+(g<<12&4294967295|g>>>20),g=y+(p^v&(m^p))+T[2]+606105819&4294967295,y=v+(g<<17&4294967295|g>>>15),g=p+(m^y&(v^m))+T[3]+3250441966&4294967295,p=y+(g<<22&4294967295|g>>>10),g=m+(v^p&(y^v))+T[4]+4118548399&4294967295,m=p+(g<<7&4294967295|g>>>25),g=v+(y^m&(p^y))+T[5]+1200080426&4294967295,v=m+(g<<12&4294967295|g>>>20),g=y+(p^v&(m^p))+T[6]+2821735955&4294967295,y=v+(g<<17&4294967295|g>>>15),g=p+(m^y&(v^m))+T[7]+4249261313&4294967295,p=y+(g<<22&4294967295|g>>>10),g=m+(v^p&(y^v))+T[8]+1770035416&4294967295,m=p+(g<<7&4294967295|g>>>25),g=v+(y^m&(p^y))+T[9]+2336552879&4294967295,v=m+(g<<12&4294967295|g>>>20),g=y+(p^v&(m^p))+T[10]+4294925233&4294967295,y=v+(g<<17&4294967295|g>>>15),g=p+(m^y&(v^m))+T[11]+2304563134&4294967295,p=y+(g<<22&4294967295|g>>>10),g=m+(v^p&(y^v))+T[12]+1804603682&4294967295,m=p+(g<<7&4294967295|g>>>25),g=v+(y^m&(p^y))+T[13]+4254626195&4294967295,v=m+(g<<12&4294967295|g>>>20),g=y+(p^v&(m^p))+T[14]+2792965006&4294967295,y=v+(g<<17&4294967295|g>>>15),g=p+(m^y&(v^m))+T[15]+1236535329&4294967295,p=y+(g<<22&4294967295|g>>>10),g=m+(y^v&(p^y))+T[1]+4129170786&4294967295,m=p+(g<<5&4294967295|g>>>27),g=v+(p^y&(m^p))+T[6]+3225465664&4294967295,v=m+(g<<9&4294967295|g>>>23),g=y+(m^p&(v^m))+T[11]+643717713&4294967295,y=v+(g<<14&4294967295|g>>>18),g=p+(v^m&(y^v))+T[0]+3921069994&4294967295,p=y+(g<<20&4294967295|g>>>12),g=m+(y^v&(p^y))+T[5]+3593408605&4294967295,m=p+(g<<5&4294967295|g>>>27),g=v+(p^y&(m^p))+T[10]+38016083&4294967295,v=m+(g<<9&4294967295|g>>>23),g=y+(m^p&(v^m))+T[15]+3634488961&4294967295,y=v+(g<<14&4294967295|g>>>18),g=p+(v^m&(y^v))+T[4]+3889429448&4294967295,p=y+(g<<20&4294967295|g>>>12),g=m+(y^v&(p^y))+T[9]+568446438&4294967295,m=p+(g<<5&4294967295|g>>>27),g=v+(p^y&(m^p))+T[14]+3275163606&4294967295,v=m+(g<<9&4294967295|g>>>23),g=y+(m^p&(v^m))+T[3]+4107603335&4294967295,y=v+(g<<14&4294967295|g>>>18),g=p+(v^m&(y^v))+T[8]+1163531501&4294967295,p=y+(g<<20&4294967295|g>>>12),g=m+(y^v&(p^y))+T[13]+2850285829&4294967295,m=p+(g<<5&4294967295|g>>>27),g=v+(p^y&(m^p))+T[2]+4243563512&4294967295,v=m+(g<<9&4294967295|g>>>23),g=y+(m^p&(v^m))+T[7]+1735328473&4294967295,y=v+(g<<14&4294967295|g>>>18),g=p+(v^m&(y^v))+T[12]+2368359562&4294967295,p=y+(g<<20&4294967295|g>>>12),g=m+(p^y^v)+T[5]+4294588738&4294967295,m=p+(g<<4&4294967295|g>>>28),g=v+(m^p^y)+T[8]+2272392833&4294967295,v=m+(g<<11&4294967295|g>>>21),g=y+(v^m^p)+T[11]+1839030562&4294967295,y=v+(g<<16&4294967295|g>>>16),g=p+(y^v^m)+T[14]+4259657740&4294967295,p=y+(g<<23&4294967295|g>>>9),g=m+(p^y^v)+T[1]+2763975236&4294967295,m=p+(g<<4&4294967295|g>>>28),g=v+(m^p^y)+T[4]+1272893353&4294967295,v=m+(g<<11&4294967295|g>>>21),g=y+(v^m^p)+T[7]+4139469664&4294967295,y=v+(g<<16&4294967295|g>>>16),g=p+(y^v^m)+T[10]+3200236656&4294967295,p=y+(g<<23&4294967295|g>>>9),g=m+(p^y^v)+T[13]+681279174&4294967295,m=p+(g<<4&4294967295|g>>>28),g=v+(m^p^y)+T[0]+3936430074&4294967295,v=m+(g<<11&4294967295|g>>>21),g=y+(v^m^p)+T[3]+3572445317&4294967295,y=v+(g<<16&4294967295|g>>>16),g=p+(y^v^m)+T[6]+76029189&4294967295,p=y+(g<<23&4294967295|g>>>9),g=m+(p^y^v)+T[9]+3654602809&4294967295,m=p+(g<<4&4294967295|g>>>28),g=v+(m^p^y)+T[12]+3873151461&4294967295,v=m+(g<<11&4294967295|g>>>21),g=y+(v^m^p)+T[15]+530742520&4294967295,y=v+(g<<16&4294967295|g>>>16),g=p+(y^v^m)+T[2]+3299628645&4294967295,p=y+(g<<23&4294967295|g>>>9),g=m+(y^(p|~v))+T[0]+4096336452&4294967295,m=p+(g<<6&4294967295|g>>>26),g=v+(p^(m|~y))+T[7]+1126891415&4294967295,v=m+(g<<10&4294967295|g>>>22),g=y+(m^(v|~p))+T[14]+2878612391&4294967295,y=v+(g<<15&4294967295|g>>>17),g=p+(v^(y|~m))+T[5]+4237533241&4294967295,p=y+(g<<21&4294967295|g>>>11),g=m+(y^(p|~v))+T[12]+1700485571&4294967295,m=p+(g<<6&4294967295|g>>>26),g=v+(p^(m|~y))+T[3]+2399980690&4294967295,v=m+(g<<10&4294967295|g>>>22),g=y+(m^(v|~p))+T[10]+4293915773&4294967295,y=v+(g<<15&4294967295|g>>>17),g=p+(v^(y|~m))+T[1]+2240044497&4294967295,p=y+(g<<21&4294967295|g>>>11),g=m+(y^(p|~v))+T[8]+1873313359&4294967295,m=p+(g<<6&4294967295|g>>>26),g=v+(p^(m|~y))+T[15]+4264355552&4294967295,v=m+(g<<10&4294967295|g>>>22),g=y+(m^(v|~p))+T[6]+2734768916&4294967295,y=v+(g<<15&4294967295|g>>>17),g=p+(v^(y|~m))+T[13]+1309151649&4294967295,p=y+(g<<21&4294967295|g>>>11),g=m+(y^(p|~v))+T[4]+4149444226&4294967295,m=p+(g<<6&4294967295|g>>>26),g=v+(p^(m|~y))+T[11]+3174756917&4294967295,v=m+(g<<10&4294967295|g>>>22),g=y+(m^(v|~p))+T[2]+718787259&4294967295,y=v+(g<<15&4294967295|g>>>17),g=p+(v^(y|~m))+T[9]+3951481745&4294967295,E.g[0]=E.g[0]+m&4294967295,E.g[1]=E.g[1]+(y+(g<<21&4294967295|g>>>11))&4294967295,E.g[2]=E.g[2]+y&4294967295,E.g[3]=E.g[3]+v&4294967295}r.prototype.v=function(E,m){m===void 0&&(m=E.length);const p=m-this.blockSize,T=this.C;let y=this.h,v=0;for(;v<m;){if(y==0)for(;v<=p;)i(this,E,v),v+=this.blockSize;if(typeof E=="string"){for(;v<m;)if(T[y++]=E.charCodeAt(v++),y==this.blockSize){i(this,T),y=0;break}}else for(;v<m;)if(T[y++]=E[v++],y==this.blockSize){i(this,T),y=0;break}}this.h=y,this.o+=m},r.prototype.A=function(){var E=Array((this.h<56?this.blockSize:this.blockSize*2)-this.h);E[0]=128;for(var m=1;m<E.length-8;++m)E[m]=0;m=this.o*8;for(var p=E.length-8;p<E.length;++p)E[p]=m&255,m/=256;for(this.v(E),E=Array(16),m=0,p=0;p<4;++p)for(let T=0;T<32;T+=8)E[m++]=this.g[p]>>>T&255;return E};function o(E,m){var p=l;return Object.prototype.hasOwnProperty.call(p,E)?p[E]:p[E]=m(E)}function u(E,m){this.h=m;const p=[];let T=!0;for(let y=E.length-1;y>=0;y--){const v=E[y]|0;T&&v==m||(p[y]=v,T=!1)}this.g=p}var l={};function d(E){return-128<=E&&E<128?o(E,function(m){return new u([m|0],m<0?-1:0)}):new u([E|0],E<0?-1:0)}function f(E){if(isNaN(E)||!isFinite(E))return w;if(E<0)return D(f(-E));const m=[];let p=1;for(let T=0;E>=p;T++)m[T]=E/p|0,p*=4294967296;return new u(m,0)}function _(E,m){if(E.length==0)throw Error("number format error: empty string");if(m=m||10,m<2||36<m)throw Error("radix out of range: "+m);if(E.charAt(0)=="-")return D(_(E.substring(1),m));if(E.indexOf("-")>=0)throw Error('number format error: interior "-" character');const p=f(Math.pow(m,8));let T=w;for(let v=0;v<E.length;v+=8){var y=Math.min(8,E.length-v);const g=parseInt(E.substring(v,v+y),m);y<8?(y=f(Math.pow(m,y)),T=T.j(y).add(f(g))):(T=T.j(p),T=T.add(f(g)))}return T}var w=d(0),R=d(1),S=d(16777216);n=u.prototype,n.m=function(){if(O(this))return-D(this).m();let E=0,m=1;for(let p=0;p<this.g.length;p++){const T=this.i(p);E+=(T>=0?T:4294967296+T)*m,m*=4294967296}return E},n.toString=function(E){if(E=E||10,E<2||36<E)throw Error("radix out of range: "+E);if(x(this))return"0";if(O(this))return"-"+D(this).toString(E);const m=f(Math.pow(E,6));var p=this;let T="";for(;;){const y=at(p,m).g;p=X(p,y.j(m));let v=((p.g.length>0?p.g[0]:p.h)>>>0).toString(E);if(p=y,x(p))return v+T;for(;v.length<6;)v="0"+v;T=v+T}},n.i=function(E){return E<0?0:E<this.g.length?this.g[E]:this.h};function x(E){if(E.h!=0)return!1;for(let m=0;m<E.g.length;m++)if(E.g[m]!=0)return!1;return!0}function O(E){return E.h==-1}n.l=function(E){return E=X(this,E),O(E)?-1:x(E)?0:1};function D(E){const m=E.g.length,p=[];for(let T=0;T<m;T++)p[T]=~E.g[T];return new u(p,~E.h).add(R)}n.abs=function(){return O(this)?D(this):this},n.add=function(E){const m=Math.max(this.g.length,E.g.length),p=[];let T=0;for(let y=0;y<=m;y++){let v=T+(this.i(y)&65535)+(E.i(y)&65535),g=(v>>>16)+(this.i(y)>>>16)+(E.i(y)>>>16);T=g>>>16,v&=65535,g&=65535,p[y]=g<<16|v}return new u(p,p[p.length-1]&-2147483648?-1:0)};function X(E,m){return E.add(D(m))}n.j=function(E){if(x(this)||x(E))return w;if(O(this))return O(E)?D(this).j(D(E)):D(D(this).j(E));if(O(E))return D(this.j(D(E)));if(this.l(S)<0&&E.l(S)<0)return f(this.m()*E.m());const m=this.g.length+E.g.length,p=[];for(var T=0;T<2*m;T++)p[T]=0;for(T=0;T<this.g.length;T++)for(let y=0;y<E.g.length;y++){const v=this.i(T)>>>16,g=this.i(T)&65535,Tt=E.i(y)>>>16,ee=E.i(y)&65535;p[2*T+2*y]+=g*ee,z(p,2*T+2*y),p[2*T+2*y+1]+=v*ee,z(p,2*T+2*y+1),p[2*T+2*y+1]+=g*Tt,z(p,2*T+2*y+1),p[2*T+2*y+2]+=v*Tt,z(p,2*T+2*y+2)}for(E=0;E<m;E++)p[E]=p[2*E+1]<<16|p[2*E];for(E=m;E<2*m;E++)p[E]=0;return new u(p,0)};function z(E,m){for(;(E[m]&65535)!=E[m];)E[m+1]+=E[m]>>>16,E[m]&=65535,m++}function G(E,m){this.g=E,this.h=m}function at(E,m){if(x(m))throw Error("division by zero");if(x(E))return new G(w,w);if(O(E))return m=at(D(E),m),new G(D(m.g),D(m.h));if(O(m))return m=at(E,D(m)),new G(D(m.g),m.h);if(E.g.length>30){if(O(E)||O(m))throw Error("slowDivide_ only works with positive integers.");for(var p=R,T=m;T.l(E)<=0;)p=vt(p),T=vt(T);var y=rt(p,1),v=rt(T,1);for(T=rt(T,2),p=rt(p,2);!x(T);){var g=v.add(T);g.l(E)<=0&&(y=y.add(p),v=g),T=rt(T,1),p=rt(p,1)}return m=X(E,y.j(m)),new G(y,m)}for(y=w;E.l(m)>=0;){for(p=Math.max(1,Math.floor(E.m()/m.m())),T=Math.ceil(Math.log(p)/Math.LN2),T=T<=48?1:Math.pow(2,T-48),v=f(p),g=v.j(m);O(g)||g.l(E)>0;)p-=T,v=f(p),g=v.j(m);x(v)&&(v=R),y=y.add(v),E=X(E,g)}return new G(y,E)}n.B=function(E){return at(this,E).h},n.and=function(E){const m=Math.max(this.g.length,E.g.length),p=[];for(let T=0;T<m;T++)p[T]=this.i(T)&E.i(T);return new u(p,this.h&E.h)},n.or=function(E){const m=Math.max(this.g.length,E.g.length),p=[];for(let T=0;T<m;T++)p[T]=this.i(T)|E.i(T);return new u(p,this.h|E.h)},n.xor=function(E){const m=Math.max(this.g.length,E.g.length),p=[];for(let T=0;T<m;T++)p[T]=this.i(T)^E.i(T);return new u(p,this.h^E.h)};function vt(E){const m=E.g.length+1,p=[];for(let T=0;T<m;T++)p[T]=E.i(T)<<1|E.i(T-1)>>>31;return new u(p,E.h)}function rt(E,m){const p=m>>5;m%=32;const T=E.g.length-p,y=[];for(let v=0;v<T;v++)y[v]=m>0?E.i(v+p)>>>m|E.i(v+p+1)<<32-m:E.i(v+p);return new u(y,E.h)}r.prototype.digest=r.prototype.A,r.prototype.reset=r.prototype.u,r.prototype.update=r.prototype.v,Ia=r,u.prototype.add=u.prototype.add,u.prototype.multiply=u.prototype.j,u.prototype.modulo=u.prototype.B,u.prototype.compare=u.prototype.l,u.prototype.toNumber=u.prototype.m,u.prototype.toString=u.prototype.toString,u.prototype.getBits=u.prototype.i,u.fromNumber=f,u.fromString=_,Gt=u}).apply(typeof lo<"u"?lo:typeof self<"u"?self:typeof window<"u"?window:{});var Fn=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var va,Ze,wa,zn,ss,Aa,Ra,Ca;(function(){var n,t=Object.defineProperty;function e(s){s=[typeof globalThis=="object"&&globalThis,s,typeof window=="object"&&window,typeof self=="object"&&self,typeof Fn=="object"&&Fn];for(var a=0;a<s.length;++a){var c=s[a];if(c&&c.Math==Math)return c}throw Error("Cannot find global object")}var r=e(this);function i(s,a){if(a)t:{var c=r;s=s.split(".");for(var h=0;h<s.length-1;h++){var I=s[h];if(!(I in c))break t;c=c[I]}s=s[s.length-1],h=c[s],a=a(h),a!=h&&a!=null&&t(c,s,{configurable:!0,writable:!0,value:a})}}i("Symbol.dispose",function(s){return s||Symbol("Symbol.dispose")}),i("Array.prototype.values",function(s){return s||function(){return this[Symbol.iterator]()}}),i("Object.entries",function(s){return s||function(a){var c=[],h;for(h in a)Object.prototype.hasOwnProperty.call(a,h)&&c.push([h,a[h]]);return c}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var o=o||{},u=this||self;function l(s){var a=typeof s;return a=="object"&&s!=null||a=="function"}function d(s,a,c){return s.call.apply(s.bind,arguments)}function f(s,a,c){return f=d,f.apply(null,arguments)}function _(s,a){var c=Array.prototype.slice.call(arguments,1);return function(){var h=c.slice();return h.push.apply(h,arguments),s.apply(this,h)}}function w(s,a){function c(){}c.prototype=a.prototype,s.Z=a.prototype,s.prototype=new c,s.prototype.constructor=s,s.Ob=function(h,I,A){for(var b=Array(arguments.length-2),F=2;F<arguments.length;F++)b[F-2]=arguments[F];return a.prototype[I].apply(h,b)}}var R=typeof AsyncContext<"u"&&typeof AsyncContext.Snapshot=="function"?s=>s&&AsyncContext.Snapshot.wrap(s):s=>s;function S(s){const a=s.length;if(a>0){const c=Array(a);for(let h=0;h<a;h++)c[h]=s[h];return c}return[]}function x(s,a){for(let h=1;h<arguments.length;h++){const I=arguments[h];var c=typeof I;if(c=c!="object"?c:I?Array.isArray(I)?"array":c:"null",c=="array"||c=="object"&&typeof I.length=="number"){c=s.length||0;const A=I.length||0;s.length=c+A;for(let b=0;b<A;b++)s[c+b]=I[b]}else s.push(I)}}class O{constructor(a,c){this.i=a,this.j=c,this.h=0,this.g=null}get(){let a;return this.h>0?(this.h--,a=this.g,this.g=a.next,a.next=null):a=this.i(),a}}function D(s){u.setTimeout(()=>{throw s},0)}function X(){var s=E;let a=null;return s.g&&(a=s.g,s.g=s.g.next,s.g||(s.h=null),a.next=null),a}class z{constructor(){this.h=this.g=null}add(a,c){const h=G.get();h.set(a,c),this.h?this.h.next=h:this.g=h,this.h=h}}var G=new O(()=>new at,s=>s.reset());class at{constructor(){this.next=this.g=this.h=null}set(a,c){this.h=a,this.g=c,this.next=null}reset(){this.next=this.g=this.h=null}}let vt,rt=!1,E=new z,m=()=>{const s=Promise.resolve(void 0);vt=()=>{s.then(p)}};function p(){for(var s;s=X();){try{s.h.call(s.g)}catch(c){D(c)}var a=G;a.j(s),a.h<100&&(a.h++,s.next=a.g,a.g=s)}rt=!1}function T(){this.u=this.u,this.C=this.C}T.prototype.u=!1,T.prototype.dispose=function(){this.u||(this.u=!0,this.N())},T.prototype[Symbol.dispose]=function(){this.dispose()},T.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function y(s,a){this.type=s,this.g=this.target=a,this.defaultPrevented=!1}y.prototype.h=function(){this.defaultPrevented=!0};var v=function(){if(!u.addEventListener||!Object.defineProperty)return!1;var s=!1,a=Object.defineProperty({},"passive",{get:function(){s=!0}});try{const c=()=>{};u.addEventListener("test",c,a),u.removeEventListener("test",c,a)}catch{}return s}();function g(s){return/^[\s\xa0]*$/.test(s)}function Tt(s,a){y.call(this,s?s.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,s&&this.init(s,a)}w(Tt,y),Tt.prototype.init=function(s,a){const c=this.type=s.type,h=s.changedTouches&&s.changedTouches.length?s.changedTouches[0]:null;this.target=s.target||s.srcElement,this.g=a,a=s.relatedTarget,a||(c=="mouseover"?a=s.fromElement:c=="mouseout"&&(a=s.toElement)),this.relatedTarget=a,h?(this.clientX=h.clientX!==void 0?h.clientX:h.pageX,this.clientY=h.clientY!==void 0?h.clientY:h.pageY,this.screenX=h.screenX||0,this.screenY=h.screenY||0):(this.clientX=s.clientX!==void 0?s.clientX:s.pageX,this.clientY=s.clientY!==void 0?s.clientY:s.pageY,this.screenX=s.screenX||0,this.screenY=s.screenY||0),this.button=s.button,this.key=s.key||"",this.ctrlKey=s.ctrlKey,this.altKey=s.altKey,this.shiftKey=s.shiftKey,this.metaKey=s.metaKey,this.pointerId=s.pointerId||0,this.pointerType=s.pointerType,this.state=s.state,this.i=s,s.defaultPrevented&&Tt.Z.h.call(this)},Tt.prototype.h=function(){Tt.Z.h.call(this);const s=this.i;s.preventDefault?s.preventDefault():s.returnValue=!1};var ee="closure_listenable_"+(Math.random()*1e6|0),ku=0;function xu(s,a,c,h,I){this.listener=s,this.proxy=null,this.src=a,this.type=c,this.capture=!!h,this.ha=I,this.key=++ku,this.da=this.fa=!1}function wn(s){s.da=!0,s.listener=null,s.proxy=null,s.src=null,s.ha=null}function An(s,a,c){for(const h in s)a.call(c,s[h],h,s)}function Ou(s,a){for(const c in s)a.call(void 0,s[c],c,s)}function Ys(s){const a={};for(const c in s)a[c]=s[c];return a}const Js="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function Zs(s,a){let c,h;for(let I=1;I<arguments.length;I++){h=arguments[I];for(c in h)s[c]=h[c];for(let A=0;A<Js.length;A++)c=Js[A],Object.prototype.hasOwnProperty.call(h,c)&&(s[c]=h[c])}}function Rn(s){this.src=s,this.g={},this.h=0}Rn.prototype.add=function(s,a,c,h,I){const A=s.toString();s=this.g[A],s||(s=this.g[A]=[],this.h++);const b=_r(s,a,h,I);return b>-1?(a=s[b],c||(a.fa=!1)):(a=new xu(a,this.src,A,!!h,I),a.fa=c,s.push(a)),a};function pr(s,a){const c=a.type;if(c in s.g){var h=s.g[c],I=Array.prototype.indexOf.call(h,a,void 0),A;(A=I>=0)&&Array.prototype.splice.call(h,I,1),A&&(wn(a),s.g[c].length==0&&(delete s.g[c],s.h--))}}function _r(s,a,c,h){for(let I=0;I<s.length;++I){const A=s[I];if(!A.da&&A.listener==a&&A.capture==!!c&&A.ha==h)return I}return-1}var yr="closure_lm_"+(Math.random()*1e6|0),Er={};function ti(s,a,c,h,I){if(Array.isArray(a)){for(let A=0;A<a.length;A++)ti(s,a[A],c,h,I);return null}return c=ri(c),s&&s[ee]?s.J(a,c,l(h)?!!h.capture:!1,I):Mu(s,a,c,!1,h,I)}function Mu(s,a,c,h,I,A){if(!a)throw Error("Invalid event type");const b=l(I)?!!I.capture:!!I;let F=Ir(s);if(F||(s[yr]=F=new Rn(s)),c=F.add(a,c,h,b,A),c.proxy)return c;if(h=Lu(),c.proxy=h,h.src=s,h.listener=c,s.addEventListener)v||(I=b),I===void 0&&(I=!1),s.addEventListener(a.toString(),h,I);else if(s.attachEvent)s.attachEvent(ni(a.toString()),h);else if(s.addListener&&s.removeListener)s.addListener(h);else throw Error("addEventListener and attachEvent are unavailable.");return c}function Lu(){function s(c){return a.call(s.src,s.listener,c)}const a=Fu;return s}function ei(s,a,c,h,I){if(Array.isArray(a))for(var A=0;A<a.length;A++)ei(s,a[A],c,h,I);else h=l(h)?!!h.capture:!!h,c=ri(c),s&&s[ee]?(s=s.i,A=String(a).toString(),A in s.g&&(a=s.g[A],c=_r(a,c,h,I),c>-1&&(wn(a[c]),Array.prototype.splice.call(a,c,1),a.length==0&&(delete s.g[A],s.h--)))):s&&(s=Ir(s))&&(a=s.g[a.toString()],s=-1,a&&(s=_r(a,c,h,I)),(c=s>-1?a[s]:null)&&Tr(c))}function Tr(s){if(typeof s!="number"&&s&&!s.da){var a=s.src;if(a&&a[ee])pr(a.i,s);else{var c=s.type,h=s.proxy;a.removeEventListener?a.removeEventListener(c,h,s.capture):a.detachEvent?a.detachEvent(ni(c),h):a.addListener&&a.removeListener&&a.removeListener(h),(c=Ir(a))?(pr(c,s),c.h==0&&(c.src=null,a[yr]=null)):wn(s)}}}function ni(s){return s in Er?Er[s]:Er[s]="on"+s}function Fu(s,a){if(s.da)s=!0;else{a=new Tt(a,this);const c=s.listener,h=s.ha||s.src;s.fa&&Tr(s),s=c.call(h,a)}return s}function Ir(s){return s=s[yr],s instanceof Rn?s:null}var vr="__closure_events_fn_"+(Math.random()*1e9>>>0);function ri(s){return typeof s=="function"?s:(s[vr]||(s[vr]=function(a){return s.handleEvent(a)}),s[vr])}function dt(){T.call(this),this.i=new Rn(this),this.M=this,this.G=null}w(dt,T),dt.prototype[ee]=!0,dt.prototype.removeEventListener=function(s,a,c,h){ei(this,s,a,c,h)};function pt(s,a){var c,h=s.G;if(h)for(c=[];h;h=h.G)c.push(h);if(s=s.M,h=a.type||a,typeof a=="string")a=new y(a,s);else if(a instanceof y)a.target=a.target||s;else{var I=a;a=new y(h,s),Zs(a,I)}I=!0;let A,b;if(c)for(b=c.length-1;b>=0;b--)A=a.g=c[b],I=Cn(A,h,!0,a)&&I;if(A=a.g=s,I=Cn(A,h,!0,a)&&I,I=Cn(A,h,!1,a)&&I,c)for(b=0;b<c.length;b++)A=a.g=c[b],I=Cn(A,h,!1,a)&&I}dt.prototype.N=function(){if(dt.Z.N.call(this),this.i){var s=this.i;for(const a in s.g){const c=s.g[a];for(let h=0;h<c.length;h++)wn(c[h]);delete s.g[a],s.h--}}this.G=null},dt.prototype.J=function(s,a,c,h){return this.i.add(String(s),a,!1,c,h)},dt.prototype.K=function(s,a,c,h){return this.i.add(String(s),a,!0,c,h)};function Cn(s,a,c,h){if(a=s.i.g[String(a)],!a)return!0;a=a.concat();let I=!0;for(let A=0;A<a.length;++A){const b=a[A];if(b&&!b.da&&b.capture==c){const F=b.listener,st=b.ha||b.src;b.fa&&pr(s.i,b),I=F.call(st,h)!==!1&&I}}return I&&!h.defaultPrevented}function Uu(s,a){if(typeof s!="function")if(s&&typeof s.handleEvent=="function")s=f(s.handleEvent,s);else throw Error("Invalid listener argument");return Number(a)>2147483647?-1:u.setTimeout(s,a||0)}function si(s){s.g=Uu(()=>{s.g=null,s.i&&(s.i=!1,si(s))},s.l);const a=s.h;s.h=null,s.m.apply(null,a)}class Bu extends T{constructor(a,c){super(),this.m=a,this.l=c,this.h=null,this.i=!1,this.g=null}j(a){this.h=arguments,this.g?this.i=!0:si(this)}N(){super.N(),this.g&&(u.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function Le(s){T.call(this),this.h=s,this.g={}}w(Le,T);var ii=[];function oi(s){An(s.g,function(a,c){this.g.hasOwnProperty(c)&&Tr(a)},s),s.g={}}Le.prototype.N=function(){Le.Z.N.call(this),oi(this)},Le.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var wr=u.JSON.stringify,ju=u.JSON.parse,qu=class{stringify(s){return u.JSON.stringify(s,void 0)}parse(s){return u.JSON.parse(s,void 0)}};function ai(){}function ui(){}var Fe={OPEN:"a",hb:"b",ERROR:"c",tb:"d"};function Ar(){y.call(this,"d")}w(Ar,y);function Rr(){y.call(this,"c")}w(Rr,y);var ne={},ci=null;function Sn(){return ci=ci||new dt}ne.Ia="serverreachability";function li(s){y.call(this,ne.Ia,s)}w(li,y);function Ue(s){const a=Sn();pt(a,new li(a))}ne.STAT_EVENT="statevent";function hi(s,a){y.call(this,ne.STAT_EVENT,s),this.stat=a}w(hi,y);function _t(s){const a=Sn();pt(a,new hi(a,s))}ne.Ja="timingevent";function di(s,a){y.call(this,ne.Ja,s),this.size=a}w(di,y);function Be(s,a){if(typeof s!="function")throw Error("Fn must not be null and must be a function");return u.setTimeout(function(){s()},a)}function je(){this.g=!0}je.prototype.ua=function(){this.g=!1};function $u(s,a,c,h,I,A){s.info(function(){if(s.g)if(A){var b="",F=A.split("&");for(let H=0;H<F.length;H++){var st=F[H].split("=");if(st.length>1){const ut=st[0];st=st[1];const Ct=ut.split("_");b=Ct.length>=2&&Ct[1]=="type"?b+(ut+"="+st+"&"):b+(ut+"=redacted&")}}}else b=null;else b=A;return"XMLHTTP REQ ("+h+") [attempt "+I+"]: "+a+`
`+c+`
`+b})}function zu(s,a,c,h,I,A,b){s.info(function(){return"XMLHTTP RESP ("+h+") [ attempt "+I+"]: "+a+`
`+c+`
`+A+" "+b})}function ge(s,a,c,h){s.info(function(){return"XMLHTTP TEXT ("+a+"): "+Gu(s,c)+(h?" "+h:"")})}function Hu(s,a){s.info(function(){return"TIMEOUT: "+a})}je.prototype.info=function(){};function Gu(s,a){if(!s.g)return a;if(!a)return null;try{const A=JSON.parse(a);if(A){for(s=0;s<A.length;s++)if(Array.isArray(A[s])){var c=A[s];if(!(c.length<2)){var h=c[1];if(Array.isArray(h)&&!(h.length<1)){var I=h[0];if(I!="noop"&&I!="stop"&&I!="close")for(let b=1;b<h.length;b++)h[b]=""}}}}return wr(A)}catch{return a}}var Pn={NO_ERROR:0,cb:1,qb:2,pb:3,kb:4,ob:5,rb:6,Ga:7,TIMEOUT:8,ub:9},fi={ib:"complete",Fb:"success",ERROR:"error",Ga:"abort",xb:"ready",yb:"readystatechange",TIMEOUT:"timeout",sb:"incrementaldata",wb:"progress",lb:"downloadprogress",Nb:"uploadprogress"},mi;function Cr(){}w(Cr,ai),Cr.prototype.g=function(){return new XMLHttpRequest},mi=new Cr;function qe(s){return encodeURIComponent(String(s))}function Ku(s){var a=1;s=s.split(":");const c=[];for(;a>0&&s.length;)c.push(s.shift()),a--;return s.length&&c.push(s.join(":")),c}function Mt(s,a,c,h){this.j=s,this.i=a,this.l=c,this.S=h||1,this.V=new Le(this),this.H=45e3,this.J=null,this.o=!1,this.u=this.B=this.A=this.M=this.F=this.T=this.D=null,this.G=[],this.g=null,this.C=0,this.m=this.v=null,this.X=-1,this.K=!1,this.P=0,this.O=null,this.W=this.L=this.U=this.R=!1,this.h=new gi}function gi(){this.i=null,this.g="",this.h=!1}var pi={},Sr={};function Pr(s,a,c){s.M=1,s.A=Vn(Rt(a)),s.u=c,s.R=!0,_i(s,null)}function _i(s,a){s.F=Date.now(),bn(s),s.B=Rt(s.A);var c=s.B,h=s.S;Array.isArray(h)||(h=[String(h)]),Vi(c.i,"t",h),s.C=0,c=s.j.L,s.h=new gi,s.g=Qi(s.j,c?a:null,!s.u),s.P>0&&(s.O=new Bu(f(s.Y,s,s.g),s.P)),a=s.V,c=s.g,h=s.ba;var I="readystatechange";Array.isArray(I)||(I&&(ii[0]=I.toString()),I=ii);for(let A=0;A<I.length;A++){const b=ti(c,I[A],h||a.handleEvent,!1,a.h||a);if(!b)break;a.g[b.key]=b}a=s.J?Ys(s.J):{},s.u?(s.v||(s.v="POST"),a["Content-Type"]="application/x-www-form-urlencoded",s.g.ea(s.B,s.v,s.u,a)):(s.v="GET",s.g.ea(s.B,s.v,null,a)),Ue(),$u(s.i,s.v,s.B,s.l,s.S,s.u)}Mt.prototype.ba=function(s){s=s.target;const a=this.O;a&&Ut(s)==3?a.j():this.Y(s)},Mt.prototype.Y=function(s){try{if(s==this.g)t:{const F=Ut(this.g),st=this.g.ya(),H=this.g.ca();if(!(F<3)&&(F!=3||this.g&&(this.h.h||this.g.la()||Li(this.g)))){this.K||F!=4||st==7||(st==8||H<=0?Ue(3):Ue(2)),br(this);var a=this.g.ca();this.X=a;var c=Qu(this);if(this.o=a==200,zu(this.i,this.v,this.B,this.l,this.S,F,a),this.o){if(this.U&&!this.L){e:{if(this.g){var h,I=this.g;if((h=I.g?I.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!g(h)){var A=h;break e}}A=null}if(s=A)ge(this.i,this.l,s,"Initial handshake response via X-HTTP-Initial-Response"),this.L=!0,Vr(this,s);else{this.o=!1,this.m=3,_t(12),re(this),$e(this);break t}}if(this.R){s=!0;let ut;for(;!this.K&&this.C<c.length;)if(ut=Wu(this,c),ut==Sr){F==4&&(this.m=4,_t(14),s=!1),ge(this.i,this.l,null,"[Incomplete Response]");break}else if(ut==pi){this.m=4,_t(15),ge(this.i,this.l,c,"[Invalid Chunk]"),s=!1;break}else ge(this.i,this.l,ut,null),Vr(this,ut);if(yi(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),F!=4||c.length!=0||this.h.h||(this.m=1,_t(16),s=!1),this.o=this.o&&s,!s)ge(this.i,this.l,c,"[Invalid Chunked Response]"),re(this),$e(this);else if(c.length>0&&!this.W){this.W=!0;var b=this.j;b.g==this&&b.aa&&!b.P&&(b.j.info("Great, no buffering proxy detected. Bytes received: "+c.length),Fr(b),b.P=!0,_t(11))}}else ge(this.i,this.l,c,null),Vr(this,c);F==4&&re(this),this.o&&!this.K&&(F==4?zi(this.j,this):(this.o=!1,bn(this)))}else cc(this.g),a==400&&c.indexOf("Unknown SID")>0?(this.m=3,_t(12)):(this.m=0,_t(13)),re(this),$e(this)}}}catch{}finally{}};function Qu(s){if(!yi(s))return s.g.la();const a=Li(s.g);if(a==="")return"";let c="";const h=a.length,I=Ut(s.g)==4;if(!s.h.i){if(typeof TextDecoder>"u")return re(s),$e(s),"";s.h.i=new u.TextDecoder}for(let A=0;A<h;A++)s.h.h=!0,c+=s.h.i.decode(a[A],{stream:!(I&&A==h-1)});return a.length=0,s.h.g+=c,s.C=0,s.h.g}function yi(s){return s.g?s.v=="GET"&&s.M!=2&&s.j.Aa:!1}function Wu(s,a){var c=s.C,h=a.indexOf(`
`,c);return h==-1?Sr:(c=Number(a.substring(c,h)),isNaN(c)?pi:(h+=1,h+c>a.length?Sr:(a=a.slice(h,h+c),s.C=h+c,a)))}Mt.prototype.cancel=function(){this.K=!0,re(this)};function bn(s){s.T=Date.now()+s.H,Ei(s,s.H)}function Ei(s,a){if(s.D!=null)throw Error("WatchDog timer not null");s.D=Be(f(s.aa,s),a)}function br(s){s.D&&(u.clearTimeout(s.D),s.D=null)}Mt.prototype.aa=function(){this.D=null;const s=Date.now();s-this.T>=0?(Hu(this.i,this.B),this.M!=2&&(Ue(),_t(17)),re(this),this.m=2,$e(this)):Ei(this,this.T-s)};function $e(s){s.j.I==0||s.K||zi(s.j,s)}function re(s){br(s);var a=s.O;a&&typeof a.dispose=="function"&&a.dispose(),s.O=null,oi(s.V),s.g&&(a=s.g,s.g=null,a.abort(),a.dispose())}function Vr(s,a){try{var c=s.j;if(c.I!=0&&(c.g==s||Dr(c.h,s))){if(!s.L&&Dr(c.h,s)&&c.I==3){try{var h=c.Ba.g.parse(a)}catch{h=null}if(Array.isArray(h)&&h.length==3){var I=h;if(I[0]==0){t:if(!c.v){if(c.g)if(c.g.F+3e3<s.F)On(c),kn(c);else break t;Lr(c),_t(18)}}else c.xa=I[1],0<c.xa-c.K&&I[2]<37500&&c.F&&c.A==0&&!c.C&&(c.C=Be(f(c.Va,c),6e3));vi(c.h)<=1&&c.ta&&(c.ta=void 0)}else ie(c,11)}else if((s.L||c.g==s)&&On(c),!g(a))for(I=c.Ba.g.parse(a),a=0;a<I.length;a++){let H=I[a];const ut=H[0];if(!(ut<=c.K))if(c.K=ut,H=H[1],c.I==2)if(H[0]=="c"){c.M=H[1],c.ba=H[2];const Ct=H[3];Ct!=null&&(c.ka=Ct,c.j.info("VER="+c.ka));const oe=H[4];oe!=null&&(c.za=oe,c.j.info("SVER="+c.za));const Bt=H[5];Bt!=null&&typeof Bt=="number"&&Bt>0&&(h=1.5*Bt,c.O=h,c.j.info("backChannelRequestTimeoutMs_="+h)),h=c;const jt=s.g;if(jt){const Ln=jt.g?jt.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(Ln){var A=h.h;A.g||Ln.indexOf("spdy")==-1&&Ln.indexOf("quic")==-1&&Ln.indexOf("h2")==-1||(A.j=A.l,A.g=new Set,A.h&&(Nr(A,A.h),A.h=null))}if(h.G){const Ur=jt.g?jt.g.getResponseHeader("X-HTTP-Session-Id"):null;Ur&&(h.wa=Ur,K(h.J,h.G,Ur))}}c.I=3,c.l&&c.l.ra(),c.aa&&(c.T=Date.now()-s.F,c.j.info("Handshake RTT: "+c.T+"ms")),h=c;var b=s;if(h.na=Ki(h,h.L?h.ba:null,h.W),b.L){wi(h.h,b);var F=b,st=h.O;st&&(F.H=st),F.D&&(br(F),bn(F)),h.g=b}else qi(h);c.i.length>0&&xn(c)}else H[0]!="stop"&&H[0]!="close"||ie(c,7);else c.I==3&&(H[0]=="stop"||H[0]=="close"?H[0]=="stop"?ie(c,7):Mr(c):H[0]!="noop"&&c.l&&c.l.qa(H),c.A=0)}}Ue(4)}catch{}}var Xu=class{constructor(s,a){this.g=s,this.map=a}};function Ti(s){this.l=s||10,u.PerformanceNavigationTiming?(s=u.performance.getEntriesByType("navigation"),s=s.length>0&&(s[0].nextHopProtocol=="hq"||s[0].nextHopProtocol=="h2")):s=!!(u.chrome&&u.chrome.loadTimes&&u.chrome.loadTimes()&&u.chrome.loadTimes().wasFetchedViaSpdy),this.j=s?this.l:1,this.g=null,this.j>1&&(this.g=new Set),this.h=null,this.i=[]}function Ii(s){return s.h?!0:s.g?s.g.size>=s.j:!1}function vi(s){return s.h?1:s.g?s.g.size:0}function Dr(s,a){return s.h?s.h==a:s.g?s.g.has(a):!1}function Nr(s,a){s.g?s.g.add(a):s.h=a}function wi(s,a){s.h&&s.h==a?s.h=null:s.g&&s.g.has(a)&&s.g.delete(a)}Ti.prototype.cancel=function(){if(this.i=Ai(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const s of this.g.values())s.cancel();this.g.clear()}};function Ai(s){if(s.h!=null)return s.i.concat(s.h.G);if(s.g!=null&&s.g.size!==0){let a=s.i;for(const c of s.g.values())a=a.concat(c.G);return a}return S(s.i)}var Ri=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function Yu(s,a){if(s){s=s.split("&");for(let c=0;c<s.length;c++){const h=s[c].indexOf("=");let I,A=null;h>=0?(I=s[c].substring(0,h),A=s[c].substring(h+1)):I=s[c],a(I,A?decodeURIComponent(A.replace(/\+/g," ")):"")}}}function Lt(s){this.g=this.o=this.j="",this.u=null,this.m=this.h="",this.l=!1;let a;s instanceof Lt?(this.l=s.l,ze(this,s.j),this.o=s.o,this.g=s.g,He(this,s.u),this.h=s.h,kr(this,Di(s.i)),this.m=s.m):s&&(a=String(s).match(Ri))?(this.l=!1,ze(this,a[1]||"",!0),this.o=Ge(a[2]||""),this.g=Ge(a[3]||"",!0),He(this,a[4]),this.h=Ge(a[5]||"",!0),kr(this,a[6]||"",!0),this.m=Ge(a[7]||"")):(this.l=!1,this.i=new Qe(null,this.l))}Lt.prototype.toString=function(){const s=[];var a=this.j;a&&s.push(Ke(a,Ci,!0),":");var c=this.g;return(c||a=="file")&&(s.push("//"),(a=this.o)&&s.push(Ke(a,Ci,!0),"@"),s.push(qe(c).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),c=this.u,c!=null&&s.push(":",String(c))),(c=this.h)&&(this.g&&c.charAt(0)!="/"&&s.push("/"),s.push(Ke(c,c.charAt(0)=="/"?tc:Zu,!0))),(c=this.i.toString())&&s.push("?",c),(c=this.m)&&s.push("#",Ke(c,nc)),s.join("")},Lt.prototype.resolve=function(s){const a=Rt(this);let c=!!s.j;c?ze(a,s.j):c=!!s.o,c?a.o=s.o:c=!!s.g,c?a.g=s.g:c=s.u!=null;var h=s.h;if(c)He(a,s.u);else if(c=!!s.h){if(h.charAt(0)!="/")if(this.g&&!this.h)h="/"+h;else{var I=a.h.lastIndexOf("/");I!=-1&&(h=a.h.slice(0,I+1)+h)}if(I=h,I==".."||I==".")h="";else if(I.indexOf("./")!=-1||I.indexOf("/.")!=-1){h=I.lastIndexOf("/",0)==0,I=I.split("/");const A=[];for(let b=0;b<I.length;){const F=I[b++];F=="."?h&&b==I.length&&A.push(""):F==".."?((A.length>1||A.length==1&&A[0]!="")&&A.pop(),h&&b==I.length&&A.push("")):(A.push(F),h=!0)}h=A.join("/")}else h=I}return c?a.h=h:c=s.i.toString()!=="",c?kr(a,Di(s.i)):c=!!s.m,c&&(a.m=s.m),a};function Rt(s){return new Lt(s)}function ze(s,a,c){s.j=c?Ge(a,!0):a,s.j&&(s.j=s.j.replace(/:$/,""))}function He(s,a){if(a){if(a=Number(a),isNaN(a)||a<0)throw Error("Bad port number "+a);s.u=a}else s.u=null}function kr(s,a,c){a instanceof Qe?(s.i=a,rc(s.i,s.l)):(c||(a=Ke(a,ec)),s.i=new Qe(a,s.l))}function K(s,a,c){s.i.set(a,c)}function Vn(s){return K(s,"zx",Math.floor(Math.random()*2147483648).toString(36)+Math.abs(Math.floor(Math.random()*2147483648)^Date.now()).toString(36)),s}function Ge(s,a){return s?a?decodeURI(s.replace(/%25/g,"%2525")):decodeURIComponent(s):""}function Ke(s,a,c){return typeof s=="string"?(s=encodeURI(s).replace(a,Ju),c&&(s=s.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),s):null}function Ju(s){return s=s.charCodeAt(0),"%"+(s>>4&15).toString(16)+(s&15).toString(16)}var Ci=/[#\/\?@]/g,Zu=/[#\?:]/g,tc=/[#\?]/g,ec=/[#\?@]/g,nc=/#/g;function Qe(s,a){this.h=this.g=null,this.i=s||null,this.j=!!a}function se(s){s.g||(s.g=new Map,s.h=0,s.i&&Yu(s.i,function(a,c){s.add(decodeURIComponent(a.replace(/\+/g," ")),c)}))}n=Qe.prototype,n.add=function(s,a){se(this),this.i=null,s=pe(this,s);let c=this.g.get(s);return c||this.g.set(s,c=[]),c.push(a),this.h+=1,this};function Si(s,a){se(s),a=pe(s,a),s.g.has(a)&&(s.i=null,s.h-=s.g.get(a).length,s.g.delete(a))}function Pi(s,a){return se(s),a=pe(s,a),s.g.has(a)}n.forEach=function(s,a){se(this),this.g.forEach(function(c,h){c.forEach(function(I){s.call(a,I,h,this)},this)},this)};function bi(s,a){se(s);let c=[];if(typeof a=="string")Pi(s,a)&&(c=c.concat(s.g.get(pe(s,a))));else for(s=Array.from(s.g.values()),a=0;a<s.length;a++)c=c.concat(s[a]);return c}n.set=function(s,a){return se(this),this.i=null,s=pe(this,s),Pi(this,s)&&(this.h-=this.g.get(s).length),this.g.set(s,[a]),this.h+=1,this},n.get=function(s,a){return s?(s=bi(this,s),s.length>0?String(s[0]):a):a};function Vi(s,a,c){Si(s,a),c.length>0&&(s.i=null,s.g.set(pe(s,a),S(c)),s.h+=c.length)}n.toString=function(){if(this.i)return this.i;if(!this.g)return"";const s=[],a=Array.from(this.g.keys());for(let h=0;h<a.length;h++){var c=a[h];const I=qe(c);c=bi(this,c);for(let A=0;A<c.length;A++){let b=I;c[A]!==""&&(b+="="+qe(c[A])),s.push(b)}}return this.i=s.join("&")};function Di(s){const a=new Qe;return a.i=s.i,s.g&&(a.g=new Map(s.g),a.h=s.h),a}function pe(s,a){return a=String(a),s.j&&(a=a.toLowerCase()),a}function rc(s,a){a&&!s.j&&(se(s),s.i=null,s.g.forEach(function(c,h){const I=h.toLowerCase();h!=I&&(Si(this,h),Vi(this,I,c))},s)),s.j=a}function sc(s,a){const c=new je;if(u.Image){const h=new Image;h.onload=_(Ft,c,"TestLoadImage: loaded",!0,a,h),h.onerror=_(Ft,c,"TestLoadImage: error",!1,a,h),h.onabort=_(Ft,c,"TestLoadImage: abort",!1,a,h),h.ontimeout=_(Ft,c,"TestLoadImage: timeout",!1,a,h),u.setTimeout(function(){h.ontimeout&&h.ontimeout()},1e4),h.src=s}else a(!1)}function ic(s,a){const c=new je,h=new AbortController,I=setTimeout(()=>{h.abort(),Ft(c,"TestPingServer: timeout",!1,a)},1e4);fetch(s,{signal:h.signal}).then(A=>{clearTimeout(I),A.ok?Ft(c,"TestPingServer: ok",!0,a):Ft(c,"TestPingServer: server error",!1,a)}).catch(()=>{clearTimeout(I),Ft(c,"TestPingServer: error",!1,a)})}function Ft(s,a,c,h,I){try{I&&(I.onload=null,I.onerror=null,I.onabort=null,I.ontimeout=null),h(c)}catch{}}function oc(){this.g=new qu}function xr(s){this.i=s.Sb||null,this.h=s.ab||!1}w(xr,ai),xr.prototype.g=function(){return new Dn(this.i,this.h)};function Dn(s,a){dt.call(this),this.H=s,this.o=a,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.A=new Headers,this.h=null,this.F="GET",this.D="",this.g=!1,this.B=this.j=this.l=null,this.v=new AbortController}w(Dn,dt),n=Dn.prototype,n.open=function(s,a){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.F=s,this.D=a,this.readyState=1,Xe(this)},n.send=function(s){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");if(this.v.signal.aborted)throw this.abort(),Error("Request was aborted.");this.g=!0;const a={headers:this.A,method:this.F,credentials:this.m,cache:void 0,signal:this.v.signal};s&&(a.body=s),(this.H||u).fetch(new Request(this.D,a)).then(this.Pa.bind(this),this.ga.bind(this))},n.abort=function(){this.response=this.responseText="",this.A=new Headers,this.status=0,this.v.abort(),this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),this.readyState>=1&&this.g&&this.readyState!=4&&(this.g=!1,We(this)),this.readyState=0},n.Pa=function(s){if(this.g&&(this.l=s,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=s.headers,this.readyState=2,Xe(this)),this.g&&(this.readyState=3,Xe(this),this.g)))if(this.responseType==="arraybuffer")s.arrayBuffer().then(this.Na.bind(this),this.ga.bind(this));else if(typeof u.ReadableStream<"u"&&"body"in s){if(this.j=s.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.B=new TextDecoder;Ni(this)}else s.text().then(this.Oa.bind(this),this.ga.bind(this))};function Ni(s){s.j.read().then(s.Ma.bind(s)).catch(s.ga.bind(s))}n.Ma=function(s){if(this.g){if(this.o&&s.value)this.response.push(s.value);else if(!this.o){var a=s.value?s.value:new Uint8Array(0);(a=this.B.decode(a,{stream:!s.done}))&&(this.response=this.responseText+=a)}s.done?We(this):Xe(this),this.readyState==3&&Ni(this)}},n.Oa=function(s){this.g&&(this.response=this.responseText=s,We(this))},n.Na=function(s){this.g&&(this.response=s,We(this))},n.ga=function(){this.g&&We(this)};function We(s){s.readyState=4,s.l=null,s.j=null,s.B=null,Xe(s)}n.setRequestHeader=function(s,a){this.A.append(s,a)},n.getResponseHeader=function(s){return this.h&&this.h.get(s.toLowerCase())||""},n.getAllResponseHeaders=function(){if(!this.h)return"";const s=[],a=this.h.entries();for(var c=a.next();!c.done;)c=c.value,s.push(c[0]+": "+c[1]),c=a.next();return s.join(`\r
`)};function Xe(s){s.onreadystatechange&&s.onreadystatechange.call(s)}Object.defineProperty(Dn.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(s){this.m=s?"include":"same-origin"}});function ki(s){let a="";return An(s,function(c,h){a+=h,a+=":",a+=c,a+=`\r
`}),a}function Or(s,a,c){t:{for(h in c){var h=!1;break t}h=!0}h||(c=ki(c),typeof s=="string"?c!=null&&qe(c):K(s,a,c))}function Y(s){dt.call(this),this.headers=new Map,this.L=s||null,this.h=!1,this.g=null,this.D="",this.o=0,this.l="",this.j=this.B=this.v=this.A=!1,this.m=null,this.F="",this.H=!1}w(Y,dt);var ac=/^https?$/i,uc=["POST","PUT"];n=Y.prototype,n.Fa=function(s){this.H=s},n.ea=function(s,a,c,h){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+s);a=a?a.toUpperCase():"GET",this.D=s,this.l="",this.o=0,this.A=!1,this.h=!0,this.g=this.L?this.L.g():mi.g(),this.g.onreadystatechange=R(f(this.Ca,this));try{this.B=!0,this.g.open(a,String(s),!0),this.B=!1}catch(A){xi(this,A);return}if(s=c||"",c=new Map(this.headers),h)if(Object.getPrototypeOf(h)===Object.prototype)for(var I in h)c.set(I,h[I]);else if(typeof h.keys=="function"&&typeof h.get=="function")for(const A of h.keys())c.set(A,h.get(A));else throw Error("Unknown input type for opt_headers: "+String(h));h=Array.from(c.keys()).find(A=>A.toLowerCase()=="content-type"),I=u.FormData&&s instanceof u.FormData,!(Array.prototype.indexOf.call(uc,a,void 0)>=0)||h||I||c.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[A,b]of c)this.g.setRequestHeader(A,b);this.F&&(this.g.responseType=this.F),"withCredentials"in this.g&&this.g.withCredentials!==this.H&&(this.g.withCredentials=this.H);try{this.m&&(clearTimeout(this.m),this.m=null),this.v=!0,this.g.send(s),this.v=!1}catch(A){xi(this,A)}};function xi(s,a){s.h=!1,s.g&&(s.j=!0,s.g.abort(),s.j=!1),s.l=a,s.o=5,Oi(s),Nn(s)}function Oi(s){s.A||(s.A=!0,pt(s,"complete"),pt(s,"error"))}n.abort=function(s){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.o=s||7,pt(this,"complete"),pt(this,"abort"),Nn(this))},n.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),Nn(this,!0)),Y.Z.N.call(this)},n.Ca=function(){this.u||(this.B||this.v||this.j?Mi(this):this.Xa())},n.Xa=function(){Mi(this)};function Mi(s){if(s.h&&typeof o<"u"){if(s.v&&Ut(s)==4)setTimeout(s.Ca.bind(s),0);else if(pt(s,"readystatechange"),Ut(s)==4){s.h=!1;try{const A=s.ca();t:switch(A){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var a=!0;break t;default:a=!1}var c;if(!(c=a)){var h;if(h=A===0){let b=String(s.D).match(Ri)[1]||null;!b&&u.self&&u.self.location&&(b=u.self.location.protocol.slice(0,-1)),h=!ac.test(b?b.toLowerCase():"")}c=h}if(c)pt(s,"complete"),pt(s,"success");else{s.o=6;try{var I=Ut(s)>2?s.g.statusText:""}catch{I=""}s.l=I+" ["+s.ca()+"]",Oi(s)}}finally{Nn(s)}}}}function Nn(s,a){if(s.g){s.m&&(clearTimeout(s.m),s.m=null);const c=s.g;s.g=null,a||pt(s,"ready");try{c.onreadystatechange=null}catch{}}}n.isActive=function(){return!!this.g};function Ut(s){return s.g?s.g.readyState:0}n.ca=function(){try{return Ut(this)>2?this.g.status:-1}catch{return-1}},n.la=function(){try{return this.g?this.g.responseText:""}catch{return""}},n.La=function(s){if(this.g){var a=this.g.responseText;return s&&a.indexOf(s)==0&&(a=a.substring(s.length)),ju(a)}};function Li(s){try{if(!s.g)return null;if("response"in s.g)return s.g.response;switch(s.F){case"":case"text":return s.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in s.g)return s.g.mozResponseArrayBuffer}return null}catch{return null}}function cc(s){const a={};s=(s.g&&Ut(s)>=2&&s.g.getAllResponseHeaders()||"").split(`\r
`);for(let h=0;h<s.length;h++){if(g(s[h]))continue;var c=Ku(s[h]);const I=c[0];if(c=c[1],typeof c!="string")continue;c=c.trim();const A=a[I]||[];a[I]=A,A.push(c)}Ou(a,function(h){return h.join(", ")})}n.ya=function(){return this.o},n.Ha=function(){return typeof this.l=="string"?this.l:String(this.l)};function Ye(s,a,c){return c&&c.internalChannelParams&&c.internalChannelParams[s]||a}function Fi(s){this.za=0,this.i=[],this.j=new je,this.ba=this.na=this.J=this.W=this.g=this.wa=this.G=this.H=this.u=this.U=this.o=null,this.Ya=this.V=0,this.Sa=Ye("failFast",!1,s),this.F=this.C=this.v=this.m=this.l=null,this.X=!0,this.xa=this.K=-1,this.Y=this.A=this.D=0,this.Qa=Ye("baseRetryDelayMs",5e3,s),this.Za=Ye("retryDelaySeedMs",1e4,s),this.Ta=Ye("forwardChannelMaxRetries",2,s),this.va=Ye("forwardChannelRequestTimeoutMs",2e4,s),this.ma=s&&s.xmlHttpFactory||void 0,this.Ua=s&&s.Rb||void 0,this.Aa=s&&s.useFetchStreams||!1,this.O=void 0,this.L=s&&s.supportsCrossDomainXhr||!1,this.M="",this.h=new Ti(s&&s.concurrentRequestLimit),this.Ba=new oc,this.S=s&&s.fastHandshake||!1,this.R=s&&s.encodeInitMessageHeaders||!1,this.S&&this.R&&(this.R=!1),this.Ra=s&&s.Pb||!1,s&&s.ua&&this.j.ua(),s&&s.forceLongPolling&&(this.X=!1),this.aa=!this.S&&this.X&&s&&s.detectBufferingProxy||!1,this.ia=void 0,s&&s.longPollingTimeout&&s.longPollingTimeout>0&&(this.ia=s.longPollingTimeout),this.ta=void 0,this.T=0,this.P=!1,this.ja=this.B=null}n=Fi.prototype,n.ka=8,n.I=1,n.connect=function(s,a,c,h){_t(0),this.W=s,this.H=a||{},c&&h!==void 0&&(this.H.OSID=c,this.H.OAID=h),this.F=this.X,this.J=Ki(this,null,this.W),xn(this)};function Mr(s){if(Ui(s),s.I==3){var a=s.V++,c=Rt(s.J);if(K(c,"SID",s.M),K(c,"RID",a),K(c,"TYPE","terminate"),Je(s,c),a=new Mt(s,s.j,a),a.M=2,a.A=Vn(Rt(c)),c=!1,u.navigator&&u.navigator.sendBeacon)try{c=u.navigator.sendBeacon(a.A.toString(),"")}catch{}!c&&u.Image&&(new Image().src=a.A,c=!0),c||(a.g=Qi(a.j,null),a.g.ea(a.A)),a.F=Date.now(),bn(a)}Gi(s)}function kn(s){s.g&&(Fr(s),s.g.cancel(),s.g=null)}function Ui(s){kn(s),s.v&&(u.clearTimeout(s.v),s.v=null),On(s),s.h.cancel(),s.m&&(typeof s.m=="number"&&u.clearTimeout(s.m),s.m=null)}function xn(s){if(!Ii(s.h)&&!s.m){s.m=!0;var a=s.Ea;vt||m(),rt||(vt(),rt=!0),E.add(a,s),s.D=0}}function lc(s,a){return vi(s.h)>=s.h.j-(s.m?1:0)?!1:s.m?(s.i=a.G.concat(s.i),!0):s.I==1||s.I==2||s.D>=(s.Sa?0:s.Ta)?!1:(s.m=Be(f(s.Ea,s,a),Hi(s,s.D)),s.D++,!0)}n.Ea=function(s){if(this.m)if(this.m=null,this.I==1){if(!s){this.V=Math.floor(Math.random()*1e5),s=this.V++;const I=new Mt(this,this.j,s);let A=this.o;if(this.U&&(A?(A=Ys(A),Zs(A,this.U)):A=this.U),this.u!==null||this.R||(I.J=A,A=null),this.S)t:{for(var a=0,c=0;c<this.i.length;c++){e:{var h=this.i[c];if("__data__"in h.map&&(h=h.map.__data__,typeof h=="string")){h=h.length;break e}h=void 0}if(h===void 0)break;if(a+=h,a>4096){a=c;break t}if(a===4096||c===this.i.length-1){a=c+1;break t}}a=1e3}else a=1e3;a=ji(this,I,a),c=Rt(this.J),K(c,"RID",s),K(c,"CVER",22),this.G&&K(c,"X-HTTP-Session-Id",this.G),Je(this,c),A&&(this.R?a="headers="+qe(ki(A))+"&"+a:this.u&&Or(c,this.u,A)),Nr(this.h,I),this.Ra&&K(c,"TYPE","init"),this.S?(K(c,"$req",a),K(c,"SID","null"),I.U=!0,Pr(I,c,null)):Pr(I,c,a),this.I=2}}else this.I==3&&(s?Bi(this,s):this.i.length==0||Ii(this.h)||Bi(this))};function Bi(s,a){var c;a?c=a.l:c=s.V++;const h=Rt(s.J);K(h,"SID",s.M),K(h,"RID",c),K(h,"AID",s.K),Je(s,h),s.u&&s.o&&Or(h,s.u,s.o),c=new Mt(s,s.j,c,s.D+1),s.u===null&&(c.J=s.o),a&&(s.i=a.G.concat(s.i)),a=ji(s,c,1e3),c.H=Math.round(s.va*.5)+Math.round(s.va*.5*Math.random()),Nr(s.h,c),Pr(c,h,a)}function Je(s,a){s.H&&An(s.H,function(c,h){K(a,h,c)}),s.l&&An({},function(c,h){K(a,h,c)})}function ji(s,a,c){c=Math.min(s.i.length,c);const h=s.l?f(s.l.Ka,s.l,s):null;t:{var I=s.i;let F=-1;for(;;){const st=["count="+c];F==-1?c>0?(F=I[0].g,st.push("ofs="+F)):F=0:st.push("ofs="+F);let H=!0;for(let ut=0;ut<c;ut++){var A=I[ut].g;const Ct=I[ut].map;if(A-=F,A<0)F=Math.max(0,I[ut].g-100),H=!1;else try{A="req"+A+"_"||"";try{var b=Ct instanceof Map?Ct:Object.entries(Ct);for(const[oe,Bt]of b){let jt=Bt;l(Bt)&&(jt=wr(Bt)),st.push(A+oe+"="+encodeURIComponent(jt))}}catch(oe){throw st.push(A+"type="+encodeURIComponent("_badmap")),oe}}catch{h&&h(Ct)}}if(H){b=st.join("&");break t}}b=void 0}return s=s.i.splice(0,c),a.G=s,b}function qi(s){if(!s.g&&!s.v){s.Y=1;var a=s.Da;vt||m(),rt||(vt(),rt=!0),E.add(a,s),s.A=0}}function Lr(s){return s.g||s.v||s.A>=3?!1:(s.Y++,s.v=Be(f(s.Da,s),Hi(s,s.A)),s.A++,!0)}n.Da=function(){if(this.v=null,$i(this),this.aa&&!(this.P||this.g==null||this.T<=0)){var s=4*this.T;this.j.info("BP detection timer enabled: "+s),this.B=Be(f(this.Wa,this),s)}},n.Wa=function(){this.B&&(this.B=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.P=!0,_t(10),kn(this),$i(this))};function Fr(s){s.B!=null&&(u.clearTimeout(s.B),s.B=null)}function $i(s){s.g=new Mt(s,s.j,"rpc",s.Y),s.u===null&&(s.g.J=s.o),s.g.P=0;var a=Rt(s.na);K(a,"RID","rpc"),K(a,"SID",s.M),K(a,"AID",s.K),K(a,"CI",s.F?"0":"1"),!s.F&&s.ia&&K(a,"TO",s.ia),K(a,"TYPE","xmlhttp"),Je(s,a),s.u&&s.o&&Or(a,s.u,s.o),s.O&&(s.g.H=s.O);var c=s.g;s=s.ba,c.M=1,c.A=Vn(Rt(a)),c.u=null,c.R=!0,_i(c,s)}n.Va=function(){this.C!=null&&(this.C=null,kn(this),Lr(this),_t(19))};function On(s){s.C!=null&&(u.clearTimeout(s.C),s.C=null)}function zi(s,a){var c=null;if(s.g==a){On(s),Fr(s),s.g=null;var h=2}else if(Dr(s.h,a))c=a.G,wi(s.h,a),h=1;else return;if(s.I!=0){if(a.o)if(h==1){c=a.u?a.u.length:0,a=Date.now()-a.F;var I=s.D;h=Sn(),pt(h,new di(h,c)),xn(s)}else qi(s);else if(I=a.m,I==3||I==0&&a.X>0||!(h==1&&lc(s,a)||h==2&&Lr(s)))switch(c&&c.length>0&&(a=s.h,a.i=a.i.concat(c)),I){case 1:ie(s,5);break;case 4:ie(s,10);break;case 3:ie(s,6);break;default:ie(s,2)}}}function Hi(s,a){let c=s.Qa+Math.floor(Math.random()*s.Za);return s.isActive()||(c*=2),c*a}function ie(s,a){if(s.j.info("Error code "+a),a==2){var c=f(s.bb,s),h=s.Ua;const I=!h;h=new Lt(h||"//www.google.com/images/cleardot.gif"),u.location&&u.location.protocol=="http"||ze(h,"https"),Vn(h),I?sc(h.toString(),c):ic(h.toString(),c)}else _t(2);s.I=0,s.l&&s.l.pa(a),Gi(s),Ui(s)}n.bb=function(s){s?(this.j.info("Successfully pinged google.com"),_t(2)):(this.j.info("Failed to ping google.com"),_t(1))};function Gi(s){if(s.I=0,s.ja=[],s.l){const a=Ai(s.h);(a.length!=0||s.i.length!=0)&&(x(s.ja,a),x(s.ja,s.i),s.h.i.length=0,S(s.i),s.i.length=0),s.l.oa()}}function Ki(s,a,c){var h=c instanceof Lt?Rt(c):new Lt(c);if(h.g!="")a&&(h.g=a+"."+h.g),He(h,h.u);else{var I=u.location;h=I.protocol,a=a?a+"."+I.hostname:I.hostname,I=+I.port;const A=new Lt(null);h&&ze(A,h),a&&(A.g=a),I&&He(A,I),c&&(A.h=c),h=A}return c=s.G,a=s.wa,c&&a&&K(h,c,a),K(h,"VER",s.ka),Je(s,h),h}function Qi(s,a,c){if(a&&!s.L)throw Error("Can't create secondary domain capable XhrIo object.");return a=s.Aa&&!s.ma?new Y(new xr({ab:c})):new Y(s.ma),a.Fa(s.L),a}n.isActive=function(){return!!this.l&&this.l.isActive(this)};function Wi(){}n=Wi.prototype,n.ra=function(){},n.qa=function(){},n.pa=function(){},n.oa=function(){},n.isActive=function(){return!0},n.Ka=function(){};function Mn(){}Mn.prototype.g=function(s,a){return new wt(s,a)};function wt(s,a){dt.call(this),this.g=new Fi(a),this.l=s,this.h=a&&a.messageUrlParams||null,s=a&&a.messageHeaders||null,a&&a.clientProtocolHeaderRequired&&(s?s["X-Client-Protocol"]="webchannel":s={"X-Client-Protocol":"webchannel"}),this.g.o=s,s=a&&a.initMessageHeaders||null,a&&a.messageContentType&&(s?s["X-WebChannel-Content-Type"]=a.messageContentType:s={"X-WebChannel-Content-Type":a.messageContentType}),a&&a.sa&&(s?s["X-WebChannel-Client-Profile"]=a.sa:s={"X-WebChannel-Client-Profile":a.sa}),this.g.U=s,(s=a&&a.Qb)&&!g(s)&&(this.g.u=s),this.A=a&&a.supportsCrossDomainXhr||!1,this.v=a&&a.sendRawJson||!1,(a=a&&a.httpSessionIdParam)&&!g(a)&&(this.g.G=a,s=this.h,s!==null&&a in s&&(s=this.h,a in s&&delete s[a])),this.j=new _e(this)}w(wt,dt),wt.prototype.m=function(){this.g.l=this.j,this.A&&(this.g.L=!0),this.g.connect(this.l,this.h||void 0)},wt.prototype.close=function(){Mr(this.g)},wt.prototype.o=function(s){var a=this.g;if(typeof s=="string"){var c={};c.__data__=s,s=c}else this.v&&(c={},c.__data__=wr(s),s=c);a.i.push(new Xu(a.Ya++,s)),a.I==3&&xn(a)},wt.prototype.N=function(){this.g.l=null,delete this.j,Mr(this.g),delete this.g,wt.Z.N.call(this)};function Xi(s){Ar.call(this),s.__headers__&&(this.headers=s.__headers__,this.statusCode=s.__status__,delete s.__headers__,delete s.__status__);var a=s.__sm__;if(a){t:{for(const c in a){s=c;break t}s=void 0}(this.i=s)&&(s=this.i,a=a!==null&&s in a?a[s]:void 0),this.data=a}else this.data=s}w(Xi,Ar);function Yi(){Rr.call(this),this.status=1}w(Yi,Rr);function _e(s){this.g=s}w(_e,Wi),_e.prototype.ra=function(){pt(this.g,"a")},_e.prototype.qa=function(s){pt(this.g,new Xi(s))},_e.prototype.pa=function(s){pt(this.g,new Yi)},_e.prototype.oa=function(){pt(this.g,"b")},Mn.prototype.createWebChannel=Mn.prototype.g,wt.prototype.send=wt.prototype.o,wt.prototype.open=wt.prototype.m,wt.prototype.close=wt.prototype.close,Ca=function(){return new Mn},Ra=function(){return Sn()},Aa=ne,ss={jb:0,mb:1,nb:2,Hb:3,Mb:4,Jb:5,Kb:6,Ib:7,Gb:8,Lb:9,PROXY:10,NOPROXY:11,Eb:12,Ab:13,Bb:14,zb:15,Cb:16,Db:17,fb:18,eb:19,gb:20},Pn.NO_ERROR=0,Pn.TIMEOUT=8,Pn.HTTP_ERROR=6,zn=Pn,fi.COMPLETE="complete",wa=fi,ui.EventType=Fe,Fe.OPEN="a",Fe.CLOSE="b",Fe.ERROR="c",Fe.MESSAGE="d",dt.prototype.listen=dt.prototype.J,Ze=ui,Y.prototype.listenOnce=Y.prototype.K,Y.prototype.getLastError=Y.prototype.Ha,Y.prototype.getLastErrorCode=Y.prototype.ya,Y.prototype.getStatus=Y.prototype.ca,Y.prototype.getResponseJson=Y.prototype.La,Y.prototype.getResponseText=Y.prototype.la,Y.prototype.send=Y.prototype.ea,Y.prototype.setWithCredentials=Y.prototype.Fa,va=Y}).apply(typeof Fn<"u"?Fn:typeof self<"u"?self:typeof window<"u"?window:{});const ho="@firebase/firestore",fo="4.9.2";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mt{constructor(t){this.uid=t}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(t){return t.uid===this.uid}}mt.UNAUTHENTICATED=new mt(null),mt.GOOGLE_CREDENTIALS=new mt("google-credentials-uid"),mt.FIRST_PARTY=new mt("first-party-uid"),mt.MOCK_USER=new mt("mock-user");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let xe="12.3.0";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fe=new ga("@firebase/firestore");function Ee(){return fe.logLevel}function V(n,...t){if(fe.logLevel<=j.DEBUG){const e=t.map(Cs);fe.debug(`Firestore (${xe}): ${n}`,...e)}}function Ot(n,...t){if(fe.logLevel<=j.ERROR){const e=t.map(Cs);fe.error(`Firestore (${xe}): ${n}`,...e)}}function Ce(n,...t){if(fe.logLevel<=j.WARN){const e=t.map(Cs);fe.warn(`Firestore (${xe}): ${n}`,...e)}}function Cs(n){if(typeof n=="string")return n;try{/**
* @license
* Copyright 2020 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/return function(e){return JSON.stringify(e)}(n)}catch{return n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function L(n,t,e){let r="Unexpected state";typeof t=="string"?r=t:e=t,Sa(n,r,e)}function Sa(n,t,e){let r=`FIRESTORE (${xe}) INTERNAL ASSERTION FAILED: ${t} (ID: ${n.toString(16)})`;if(e!==void 0)try{r+=" CONTEXT: "+JSON.stringify(e)}catch{r+=" CONTEXT: "+e}throw Ot(r),new Error(r)}function W(n,t,e,r){let i="Unexpected state";typeof e=="string"?i=e:r=e,n||Sa(t,i,r)}function q(n,t){return n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const P={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class N extends ke{constructor(t,e){super(t,e),this.code=t,this.message=e,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ce{constructor(){this.promise=new Promise((t,e)=>{this.resolve=t,this.reject=e})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pa{constructor(t,e){this.user=e,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${t}`)}}class Yl{getToken(){return Promise.resolve(null)}invalidateToken(){}start(t,e){t.enqueueRetryable(()=>e(mt.UNAUTHENTICATED))}shutdown(){}}class Jl{constructor(t){this.token=t,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(t,e){this.changeListener=e,t.enqueueRetryable(()=>e(this.token.user))}shutdown(){this.changeListener=null}}class Zl{constructor(t){this.t=t,this.currentUser=mt.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(t,e){W(this.o===void 0,42304);let r=this.i;const i=d=>this.i!==r?(r=this.i,e(d)):Promise.resolve();let o=new ce;this.o=()=>{this.i++,this.currentUser=this.u(),o.resolve(),o=new ce,t.enqueueRetryable(()=>i(this.currentUser))};const u=()=>{const d=o;t.enqueueRetryable(async()=>{await d.promise,await i(this.currentUser)})},l=d=>{V("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=d,this.o&&(this.auth.addAuthTokenListener(this.o),u())};this.t.onInit(d=>l(d)),setTimeout(()=>{if(!this.auth){const d=this.t.getImmediate({optional:!0});d?l(d):(V("FirebaseAuthCredentialsProvider","Auth not yet detected"),o.resolve(),o=new ce)}},0),u()}getToken(){const t=this.i,e=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(e).then(r=>this.i!==t?(V("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):r?(W(typeof r.accessToken=="string",31837,{l:r}),new Pa(r.accessToken,this.currentUser)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){const t=this.auth&&this.auth.getUid();return W(t===null||typeof t=="string",2055,{h:t}),new mt(t)}}class th{constructor(t,e,r){this.P=t,this.T=e,this.I=r,this.type="FirstParty",this.user=mt.FIRST_PARTY,this.A=new Map}R(){return this.I?this.I():null}get headers(){this.A.set("X-Goog-AuthUser",this.P);const t=this.R();return t&&this.A.set("Authorization",t),this.T&&this.A.set("X-Goog-Iam-Authorization-Token",this.T),this.A}}class eh{constructor(t,e,r){this.P=t,this.T=e,this.I=r}getToken(){return Promise.resolve(new th(this.P,this.T,this.I))}start(t,e){t.enqueueRetryable(()=>e(mt.FIRST_PARTY))}shutdown(){}invalidateToken(){}}class mo{constructor(t){this.value=t,this.type="AppCheck",this.headers=new Map,t&&t.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class nh{constructor(t,e){this.V=e,this.forceRefresh=!1,this.appCheck=null,this.m=null,this.p=null,xl(t)&&t.settings.appCheckToken&&(this.p=t.settings.appCheckToken)}start(t,e){W(this.o===void 0,3512);const r=o=>{o.error!=null&&V("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${o.error.message}`);const u=o.token!==this.m;return this.m=o.token,V("FirebaseAppCheckTokenProvider",`Received ${u?"new":"existing"} token.`),u?e(o.token):Promise.resolve()};this.o=o=>{t.enqueueRetryable(()=>r(o))};const i=o=>{V("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=o,this.o&&this.appCheck.addTokenListener(this.o)};this.V.onInit(o=>i(o)),setTimeout(()=>{if(!this.appCheck){const o=this.V.getImmediate({optional:!0});o?i(o):V("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}},0)}getToken(){if(this.p)return Promise.resolve(new mo(this.p));const t=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(t).then(e=>e?(W(typeof e.token=="string",44558,{tokenResult:e}),this.m=e.token,new mo(e.token)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function rh(n){const t=typeof self<"u"&&(self.crypto||self.msCrypto),e=new Uint8Array(n);if(t&&typeof t.getRandomValues=="function")t.getRandomValues(e);else for(let r=0;r<n;r++)e[r]=Math.floor(256*Math.random());return e}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ss{static newId(){const t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",e=62*Math.floor(4.129032258064516);let r="";for(;r.length<20;){const i=rh(40);for(let o=0;o<i.length;++o)r.length<20&&i[o]<e&&(r+=t.charAt(i[o]%62))}return r}}function U(n,t){return n<t?-1:n>t?1:0}function is(n,t){const e=Math.min(n.length,t.length);for(let r=0;r<e;r++){const i=n.charAt(r),o=t.charAt(r);if(i!==o)return zr(i)===zr(o)?U(i,o):zr(i)?1:-1}return U(n.length,t.length)}const sh=55296,ih=57343;function zr(n){const t=n.charCodeAt(0);return t>=sh&&t<=ih}function Se(n,t,e){return n.length===t.length&&n.every((r,i)=>e(r,t[i]))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const go="__name__";class St{constructor(t,e,r){e===void 0?e=0:e>t.length&&L(637,{offset:e,range:t.length}),r===void 0?r=t.length-e:r>t.length-e&&L(1746,{length:r,range:t.length-e}),this.segments=t,this.offset=e,this.len=r}get length(){return this.len}isEqual(t){return St.comparator(this,t)===0}child(t){const e=this.segments.slice(this.offset,this.limit());return t instanceof St?t.forEach(r=>{e.push(r)}):e.push(t),this.construct(e)}limit(){return this.offset+this.length}popFirst(t){return t=t===void 0?1:t,this.construct(this.segments,this.offset+t,this.length-t)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(t){return this.segments[this.offset+t]}isEmpty(){return this.length===0}isPrefixOf(t){if(t.length<this.length)return!1;for(let e=0;e<this.length;e++)if(this.get(e)!==t.get(e))return!1;return!0}isImmediateParentOf(t){if(this.length+1!==t.length)return!1;for(let e=0;e<this.length;e++)if(this.get(e)!==t.get(e))return!1;return!0}forEach(t){for(let e=this.offset,r=this.limit();e<r;e++)t(this.segments[e])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(t,e){const r=Math.min(t.length,e.length);for(let i=0;i<r;i++){const o=St.compareSegments(t.get(i),e.get(i));if(o!==0)return o}return U(t.length,e.length)}static compareSegments(t,e){const r=St.isNumericId(t),i=St.isNumericId(e);return r&&!i?-1:!r&&i?1:r&&i?St.extractNumericId(t).compare(St.extractNumericId(e)):is(t,e)}static isNumericId(t){return t.startsWith("__id")&&t.endsWith("__")}static extractNumericId(t){return Gt.fromString(t.substring(4,t.length-2))}}class Q extends St{construct(t,e,r){return new Q(t,e,r)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...t){const e=[];for(const r of t){if(r.indexOf("//")>=0)throw new N(P.INVALID_ARGUMENT,`Invalid segment (${r}). Paths must not contain // in them.`);e.push(...r.split("/").filter(i=>i.length>0))}return new Q(e)}static emptyPath(){return new Q([])}}const oh=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class yt extends St{construct(t,e,r){return new yt(t,e,r)}static isValidIdentifier(t){return oh.test(t)}canonicalString(){return this.toArray().map(t=>(t=t.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),yt.isValidIdentifier(t)||(t="`"+t+"`"),t)).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===go}static keyField(){return new yt([go])}static fromServerFormat(t){const e=[];let r="",i=0;const o=()=>{if(r.length===0)throw new N(P.INVALID_ARGUMENT,`Invalid field path (${t}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);e.push(r),r=""};let u=!1;for(;i<t.length;){const l=t[i];if(l==="\\"){if(i+1===t.length)throw new N(P.INVALID_ARGUMENT,"Path has trailing escape character: "+t);const d=t[i+1];if(d!=="\\"&&d!=="."&&d!=="`")throw new N(P.INVALID_ARGUMENT,"Path has invalid escape sequence: "+t);r+=d,i+=2}else l==="`"?(u=!u,i++):l!=="."||u?(r+=l,i++):(o(),i++)}if(o(),u)throw new N(P.INVALID_ARGUMENT,"Unterminated ` in path: "+t);return new yt(e)}static emptyPath(){return new yt([])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class k{constructor(t){this.path=t}static fromPath(t){return new k(Q.fromString(t))}static fromName(t){return new k(Q.fromString(t).popFirst(5))}static empty(){return new k(Q.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(t){return this.path.length>=2&&this.path.get(this.path.length-2)===t}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(t){return t!==null&&Q.comparator(this.path,t.path)===0}toString(){return this.path.toString()}static comparator(t,e){return Q.comparator(t.path,e.path)}static isDocumentKey(t){return t.length%2==0}static fromSegments(t){return new k(new Q(t.slice()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ah(n,t,e){if(!e)throw new N(P.INVALID_ARGUMENT,`Function ${n}() cannot be called with an empty ${t}.`)}function uh(n,t,e,r){if(t===!0&&r===!0)throw new N(P.INVALID_ARGUMENT,`${n} and ${e} cannot be used together.`)}function po(n){if(!k.isDocumentKey(n))throw new N(P.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${n} has ${n.length}.`)}function ch(n){return typeof n=="object"&&n!==null&&(Object.getPrototypeOf(n)===Object.prototype||Object.getPrototypeOf(n)===null)}function lh(n){if(n===void 0)return"undefined";if(n===null)return"null";if(typeof n=="string")return n.length>20&&(n=`${n.substring(0,20)}...`),JSON.stringify(n);if(typeof n=="number"||typeof n=="boolean")return""+n;if(typeof n=="object"){if(n instanceof Array)return"an array";{const t=function(r){return r.constructor?r.constructor.name:null}(n);return t?`a custom ${t} object`:"an object"}}return typeof n=="function"?"a function":L(12329,{type:typeof n})}function os(n,t){if("_delegate"in n&&(n=n._delegate),!(n instanceof t)){if(t.name===n.constructor.name)throw new N(P.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const e=lh(n);throw new N(P.INVALID_ARGUMENT,`Expected type '${t.name}', but it was: ${e}`)}}return n}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function nt(n,t){const e={typeString:n};return t&&(e.value=t),e}function yn(n,t){if(!ch(n))throw new N(P.INVALID_ARGUMENT,"JSON must be an object");let e;for(const r in t)if(t[r]){const i=t[r].typeString,o="value"in t[r]?{value:t[r].value}:void 0;if(!(r in n)){e=`JSON missing required field: '${r}'`;break}const u=n[r];if(i&&typeof u!==i){e=`JSON field '${r}' must be a ${i}.`;break}if(o!==void 0&&u!==o.value){e=`Expected '${r}' field to equal '${o.value}'`;break}}if(e)throw new N(P.INVALID_ARGUMENT,e);return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _o=-62135596800,yo=1e6;class et{static now(){return et.fromMillis(Date.now())}static fromDate(t){return et.fromMillis(t.getTime())}static fromMillis(t){const e=Math.floor(t/1e3),r=Math.floor((t-1e3*e)*yo);return new et(e,r)}constructor(t,e){if(this.seconds=t,this.nanoseconds=e,e<0)throw new N(P.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+e);if(e>=1e9)throw new N(P.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+e);if(t<_o)throw new N(P.INVALID_ARGUMENT,"Timestamp seconds out of range: "+t);if(t>=253402300800)throw new N(P.INVALID_ARGUMENT,"Timestamp seconds out of range: "+t)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/yo}_compareTo(t){return this.seconds===t.seconds?U(this.nanoseconds,t.nanoseconds):U(this.seconds,t.seconds)}isEqual(t){return t.seconds===this.seconds&&t.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:et._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(t){if(yn(t,et._jsonSchema))return new et(t.seconds,t.nanoseconds)}valueOf(){const t=this.seconds-_o;return String(t).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}et._jsonSchemaVersion="firestore/timestamp/1.0",et._jsonSchema={type:nt("string",et._jsonSchemaVersion),seconds:nt("number"),nanoseconds:nt("number")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class M{static fromTimestamp(t){return new M(t)}static min(){return new M(new et(0,0))}static max(){return new M(new et(253402300799,999999999))}constructor(t){this.timestamp=t}compareTo(t){return this.timestamp._compareTo(t.timestamp)}isEqual(t){return this.timestamp.isEqual(t.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fn=-1;function hh(n,t){const e=n.toTimestamp().seconds,r=n.toTimestamp().nanoseconds+1,i=M.fromTimestamp(r===1e9?new et(e+1,0):new et(e,r));return new Wt(i,k.empty(),t)}function dh(n){return new Wt(n.readTime,n.key,fn)}class Wt{constructor(t,e,r){this.readTime=t,this.documentKey=e,this.largestBatchId=r}static min(){return new Wt(M.min(),k.empty(),fn)}static max(){return new Wt(M.max(),k.empty(),fn)}}function fh(n,t){let e=n.readTime.compareTo(t.readTime);return e!==0?e:(e=k.comparator(n.documentKey,t.documentKey),e!==0?e:U(n.largestBatchId,t.largestBatchId))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const mh="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";class gh{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(t){this.onCommittedListeners.push(t)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach(t=>t())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ir(n){if(n.code!==P.FAILED_PRECONDITION||n.message!==mh)throw n;V("LocalStore","Unexpectedly lost primary lease")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class C{constructor(t){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,t(e=>{this.isDone=!0,this.result=e,this.nextCallback&&this.nextCallback(e)},e=>{this.isDone=!0,this.error=e,this.catchCallback&&this.catchCallback(e)})}catch(t){return this.next(void 0,t)}next(t,e){return this.callbackAttached&&L(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(e,this.error):this.wrapSuccess(t,this.result):new C((r,i)=>{this.nextCallback=o=>{this.wrapSuccess(t,o).next(r,i)},this.catchCallback=o=>{this.wrapFailure(e,o).next(r,i)}})}toPromise(){return new Promise((t,e)=>{this.next(t,e)})}wrapUserFunction(t){try{const e=t();return e instanceof C?e:C.resolve(e)}catch(e){return C.reject(e)}}wrapSuccess(t,e){return t?this.wrapUserFunction(()=>t(e)):C.resolve(e)}wrapFailure(t,e){return t?this.wrapUserFunction(()=>t(e)):C.reject(e)}static resolve(t){return new C((e,r)=>{e(t)})}static reject(t){return new C((e,r)=>{r(t)})}static waitFor(t){return new C((e,r)=>{let i=0,o=0,u=!1;t.forEach(l=>{++i,l.next(()=>{++o,u&&o===i&&e()},d=>r(d))}),u=!0,o===i&&e()})}static or(t){let e=C.resolve(!1);for(const r of t)e=e.next(i=>i?C.resolve(i):r());return e}static forEach(t,e){const r=[];return t.forEach((i,o)=>{r.push(e.call(this,i,o))}),this.waitFor(r)}static mapArray(t,e){return new C((r,i)=>{const o=t.length,u=new Array(o);let l=0;for(let d=0;d<o;d++){const f=d;e(t[f]).next(_=>{u[f]=_,++l,l===o&&r(u)},_=>i(_))}})}static doWhile(t,e){return new C((r,i)=>{const o=()=>{t()===!0?e().next(()=>{o()},i):r()};o()})}}function ph(n){const t=n.match(/Android ([\d.]+)/i),e=t?t[1].split(".").slice(0,2).join("."):"-1";return Number(e)}function Oe(n){return n.name==="IndexedDbTransactionError"}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class or{constructor(t,e){this.previousValue=t,e&&(e.sequenceNumberHandler=r=>this.ae(r),this.ue=r=>e.writeSequenceNumber(r))}ae(t){return this.previousValue=Math.max(t,this.previousValue),this.previousValue}next(){const t=++this.previousValue;return this.ue&&this.ue(t),t}}or.ce=-1;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _h=-1;function ar(n){return n==null}function as(n){return n===0&&1/n==-1/0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ba="";function yh(n){let t="";for(let e=0;e<n.length;e++)t.length>0&&(t=Eo(t)),t=Eh(n.get(e),t);return Eo(t)}function Eh(n,t){let e=t;const r=n.length;for(let i=0;i<r;i++){const o=n.charAt(i);switch(o){case"\0":e+="";break;case ba:e+="";break;default:e+=o}}return e}function Eo(n){return n+ba+""}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function To(n){let t=0;for(const e in n)Object.prototype.hasOwnProperty.call(n,e)&&t++;return t}function En(n,t){for(const e in n)Object.prototype.hasOwnProperty.call(n,e)&&t(e,n[e])}function Th(n){for(const t in n)if(Object.prototype.hasOwnProperty.call(n,t))return!1;return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Z{constructor(t,e){this.comparator=t,this.root=e||lt.EMPTY}insert(t,e){return new Z(this.comparator,this.root.insert(t,e,this.comparator).copy(null,null,lt.BLACK,null,null))}remove(t){return new Z(this.comparator,this.root.remove(t,this.comparator).copy(null,null,lt.BLACK,null,null))}get(t){let e=this.root;for(;!e.isEmpty();){const r=this.comparator(t,e.key);if(r===0)return e.value;r<0?e=e.left:r>0&&(e=e.right)}return null}indexOf(t){let e=0,r=this.root;for(;!r.isEmpty();){const i=this.comparator(t,r.key);if(i===0)return e+r.left.size;i<0?r=r.left:(e+=r.left.size+1,r=r.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(t){return this.root.inorderTraversal(t)}forEach(t){this.inorderTraversal((e,r)=>(t(e,r),!1))}toString(){const t=[];return this.inorderTraversal((e,r)=>(t.push(`${e}:${r}`),!1)),`{${t.join(", ")}}`}reverseTraversal(t){return this.root.reverseTraversal(t)}getIterator(){return new Un(this.root,null,this.comparator,!1)}getIteratorFrom(t){return new Un(this.root,t,this.comparator,!1)}getReverseIterator(){return new Un(this.root,null,this.comparator,!0)}getReverseIteratorFrom(t){return new Un(this.root,t,this.comparator,!0)}}class Un{constructor(t,e,r,i){this.isReverse=i,this.nodeStack=[];let o=1;for(;!t.isEmpty();)if(o=e?r(t.key,e):1,e&&i&&(o*=-1),o<0)t=this.isReverse?t.left:t.right;else{if(o===0){this.nodeStack.push(t);break}this.nodeStack.push(t),t=this.isReverse?t.right:t.left}}getNext(){let t=this.nodeStack.pop();const e={key:t.key,value:t.value};if(this.isReverse)for(t=t.left;!t.isEmpty();)this.nodeStack.push(t),t=t.right;else for(t=t.right;!t.isEmpty();)this.nodeStack.push(t),t=t.left;return e}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;const t=this.nodeStack[this.nodeStack.length-1];return{key:t.key,value:t.value}}}class lt{constructor(t,e,r,i,o){this.key=t,this.value=e,this.color=r??lt.RED,this.left=i??lt.EMPTY,this.right=o??lt.EMPTY,this.size=this.left.size+1+this.right.size}copy(t,e,r,i,o){return new lt(t??this.key,e??this.value,r??this.color,i??this.left,o??this.right)}isEmpty(){return!1}inorderTraversal(t){return this.left.inorderTraversal(t)||t(this.key,this.value)||this.right.inorderTraversal(t)}reverseTraversal(t){return this.right.reverseTraversal(t)||t(this.key,this.value)||this.left.reverseTraversal(t)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(t,e,r){let i=this;const o=r(t,i.key);return i=o<0?i.copy(null,null,null,i.left.insert(t,e,r),null):o===0?i.copy(null,e,null,null,null):i.copy(null,null,null,null,i.right.insert(t,e,r)),i.fixUp()}removeMin(){if(this.left.isEmpty())return lt.EMPTY;let t=this;return t.left.isRed()||t.left.left.isRed()||(t=t.moveRedLeft()),t=t.copy(null,null,null,t.left.removeMin(),null),t.fixUp()}remove(t,e){let r,i=this;if(e(t,i.key)<0)i.left.isEmpty()||i.left.isRed()||i.left.left.isRed()||(i=i.moveRedLeft()),i=i.copy(null,null,null,i.left.remove(t,e),null);else{if(i.left.isRed()&&(i=i.rotateRight()),i.right.isEmpty()||i.right.isRed()||i.right.left.isRed()||(i=i.moveRedRight()),e(t,i.key)===0){if(i.right.isEmpty())return lt.EMPTY;r=i.right.min(),i=i.copy(r.key,r.value,null,null,i.right.removeMin())}i=i.copy(null,null,null,null,i.right.remove(t,e))}return i.fixUp()}isRed(){return this.color}fixUp(){let t=this;return t.right.isRed()&&!t.left.isRed()&&(t=t.rotateLeft()),t.left.isRed()&&t.left.left.isRed()&&(t=t.rotateRight()),t.left.isRed()&&t.right.isRed()&&(t=t.colorFlip()),t}moveRedLeft(){let t=this.colorFlip();return t.right.left.isRed()&&(t=t.copy(null,null,null,null,t.right.rotateRight()),t=t.rotateLeft(),t=t.colorFlip()),t}moveRedRight(){let t=this.colorFlip();return t.left.left.isRed()&&(t=t.rotateRight(),t=t.colorFlip()),t}rotateLeft(){const t=this.copy(null,null,lt.RED,null,this.right.left);return this.right.copy(null,null,this.color,t,null)}rotateRight(){const t=this.copy(null,null,lt.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,t)}colorFlip(){const t=this.left.copy(null,null,!this.left.color,null,null),e=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,t,e)}checkMaxDepth(){const t=this.check();return Math.pow(2,t)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw L(43730,{key:this.key,value:this.value});if(this.right.isRed())throw L(14113,{key:this.key,value:this.value});const t=this.left.check();if(t!==this.right.check())throw L(27949);return t+(this.isRed()?0:1)}}lt.EMPTY=null,lt.RED=!0,lt.BLACK=!1;lt.EMPTY=new class{constructor(){this.size=0}get key(){throw L(57766)}get value(){throw L(16141)}get color(){throw L(16727)}get left(){throw L(29726)}get right(){throw L(36894)}copy(t,e,r,i,o){return this}insert(t,e,r){return new lt(t,e)}remove(t,e){return this}isEmpty(){return!0}inorderTraversal(t){return!1}reverseTraversal(t){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ot{constructor(t){this.comparator=t,this.data=new Z(this.comparator)}has(t){return this.data.get(t)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(t){return this.data.indexOf(t)}forEach(t){this.data.inorderTraversal((e,r)=>(t(e),!1))}forEachInRange(t,e){const r=this.data.getIteratorFrom(t[0]);for(;r.hasNext();){const i=r.getNext();if(this.comparator(i.key,t[1])>=0)return;e(i.key)}}forEachWhile(t,e){let r;for(r=e!==void 0?this.data.getIteratorFrom(e):this.data.getIterator();r.hasNext();)if(!t(r.getNext().key))return}firstAfterOrEqual(t){const e=this.data.getIteratorFrom(t);return e.hasNext()?e.getNext().key:null}getIterator(){return new Io(this.data.getIterator())}getIteratorFrom(t){return new Io(this.data.getIteratorFrom(t))}add(t){return this.copy(this.data.remove(t).insert(t,!0))}delete(t){return this.has(t)?this.copy(this.data.remove(t)):this}isEmpty(){return this.data.isEmpty()}unionWith(t){let e=this;return e.size<t.size&&(e=t,t=this),t.forEach(r=>{e=e.add(r)}),e}isEqual(t){if(!(t instanceof ot)||this.size!==t.size)return!1;const e=this.data.getIterator(),r=t.data.getIterator();for(;e.hasNext();){const i=e.getNext().key,o=r.getNext().key;if(this.comparator(i,o)!==0)return!1}return!0}toArray(){const t=[];return this.forEach(e=>{t.push(e)}),t}toString(){const t=[];return this.forEach(e=>t.push(e)),"SortedSet("+t.toString()+")"}copy(t){const e=new ot(this.comparator);return e.data=t,e}}class Io{constructor(t){this.iter=t}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qt{constructor(t){this.fields=t,t.sort(yt.comparator)}static empty(){return new qt([])}unionWith(t){let e=new ot(yt.comparator);for(const r of this.fields)e=e.add(r);for(const r of t)e=e.add(r);return new qt(e.toArray())}covers(t){for(const e of this.fields)if(e.isPrefixOf(t))return!0;return!1}isEqual(t){return Se(this.fields,t.fields,(e,r)=>e.isEqual(r))}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Va extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ht{constructor(t){this.binaryString=t}static fromBase64String(t){const e=function(i){try{return atob(i)}catch(o){throw typeof DOMException<"u"&&o instanceof DOMException?new Va("Invalid base64 string: "+o):o}}(t);return new ht(e)}static fromUint8Array(t){const e=function(i){let o="";for(let u=0;u<i.length;++u)o+=String.fromCharCode(i[u]);return o}(t);return new ht(e)}[Symbol.iterator](){let t=0;return{next:()=>t<this.binaryString.length?{value:this.binaryString.charCodeAt(t++),done:!1}:{value:void 0,done:!0}}}toBase64(){return function(e){return btoa(e)}(this.binaryString)}toUint8Array(){return function(e){const r=new Uint8Array(e.length);for(let i=0;i<e.length;i++)r[i]=e.charCodeAt(i);return r}(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(t){return U(this.binaryString,t.binaryString)}isEqual(t){return this.binaryString===t.binaryString}}ht.EMPTY_BYTE_STRING=new ht("");const Ih=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function Xt(n){if(W(!!n,39018),typeof n=="string"){let t=0;const e=Ih.exec(n);if(W(!!e,46558,{timestamp:n}),e[1]){let i=e[1];i=(i+"000000000").substr(0,9),t=Number(i)}const r=new Date(n);return{seconds:Math.floor(r.getTime()/1e3),nanos:t}}return{seconds:J(n.seconds),nanos:J(n.nanos)}}function J(n){return typeof n=="number"?n:typeof n=="string"?Number(n):0}function Yt(n){return typeof n=="string"?ht.fromBase64String(n):ht.fromUint8Array(n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Da="server_timestamp",Na="__type__",ka="__previous_value__",xa="__local_write_time__";function Ps(n){var e,r;return((r=(((e=n==null?void 0:n.mapValue)==null?void 0:e.fields)||{})[Na])==null?void 0:r.stringValue)===Da}function ur(n){const t=n.mapValue.fields[ka];return Ps(t)?ur(t):t}function mn(n){const t=Xt(n.mapValue.fields[xa].timestampValue);return new et(t.seconds,t.nanos)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vh{constructor(t,e,r,i,o,u,l,d,f,_){this.databaseId=t,this.appId=e,this.persistenceKey=r,this.host=i,this.ssl=o,this.forceLongPolling=u,this.autoDetectLongPolling=l,this.longPollingOptions=d,this.useFetchStreams=f,this.isUsingEmulator=_}}const Jn="(default)";class gn{constructor(t,e){this.projectId=t,this.database=e||Jn}static empty(){return new gn("","")}get isDefaultDatabase(){return this.database===Jn}isEqual(t){return t instanceof gn&&t.projectId===this.projectId&&t.database===this.database}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const wh="__type__",Ah="__max__",Bn={mapValue:{}},Rh="__vector__",us="value";function Jt(n){return"nullValue"in n?0:"booleanValue"in n?1:"integerValue"in n||"doubleValue"in n?2:"timestampValue"in n?3:"stringValue"in n?5:"bytesValue"in n?6:"referenceValue"in n?7:"geoPointValue"in n?8:"arrayValue"in n?9:"mapValue"in n?Ps(n)?4:Sh(n)?9007199254740991:Ch(n)?10:11:L(28295,{value:n})}function Dt(n,t){if(n===t)return!0;const e=Jt(n);if(e!==Jt(t))return!1;switch(e){case 0:case 9007199254740991:return!0;case 1:return n.booleanValue===t.booleanValue;case 4:return mn(n).isEqual(mn(t));case 3:return function(i,o){if(typeof i.timestampValue=="string"&&typeof o.timestampValue=="string"&&i.timestampValue.length===o.timestampValue.length)return i.timestampValue===o.timestampValue;const u=Xt(i.timestampValue),l=Xt(o.timestampValue);return u.seconds===l.seconds&&u.nanos===l.nanos}(n,t);case 5:return n.stringValue===t.stringValue;case 6:return function(i,o){return Yt(i.bytesValue).isEqual(Yt(o.bytesValue))}(n,t);case 7:return n.referenceValue===t.referenceValue;case 8:return function(i,o){return J(i.geoPointValue.latitude)===J(o.geoPointValue.latitude)&&J(i.geoPointValue.longitude)===J(o.geoPointValue.longitude)}(n,t);case 2:return function(i,o){if("integerValue"in i&&"integerValue"in o)return J(i.integerValue)===J(o.integerValue);if("doubleValue"in i&&"doubleValue"in o){const u=J(i.doubleValue),l=J(o.doubleValue);return u===l?as(u)===as(l):isNaN(u)&&isNaN(l)}return!1}(n,t);case 9:return Se(n.arrayValue.values||[],t.arrayValue.values||[],Dt);case 10:case 11:return function(i,o){const u=i.mapValue.fields||{},l=o.mapValue.fields||{};if(To(u)!==To(l))return!1;for(const d in u)if(u.hasOwnProperty(d)&&(l[d]===void 0||!Dt(u[d],l[d])))return!1;return!0}(n,t);default:return L(52216,{left:n})}}function pn(n,t){return(n.values||[]).find(e=>Dt(e,t))!==void 0}function Pe(n,t){if(n===t)return 0;const e=Jt(n),r=Jt(t);if(e!==r)return U(e,r);switch(e){case 0:case 9007199254740991:return 0;case 1:return U(n.booleanValue,t.booleanValue);case 2:return function(o,u){const l=J(o.integerValue||o.doubleValue),d=J(u.integerValue||u.doubleValue);return l<d?-1:l>d?1:l===d?0:isNaN(l)?isNaN(d)?0:-1:1}(n,t);case 3:return vo(n.timestampValue,t.timestampValue);case 4:return vo(mn(n),mn(t));case 5:return is(n.stringValue,t.stringValue);case 6:return function(o,u){const l=Yt(o),d=Yt(u);return l.compareTo(d)}(n.bytesValue,t.bytesValue);case 7:return function(o,u){const l=o.split("/"),d=u.split("/");for(let f=0;f<l.length&&f<d.length;f++){const _=U(l[f],d[f]);if(_!==0)return _}return U(l.length,d.length)}(n.referenceValue,t.referenceValue);case 8:return function(o,u){const l=U(J(o.latitude),J(u.latitude));return l!==0?l:U(J(o.longitude),J(u.longitude))}(n.geoPointValue,t.geoPointValue);case 9:return wo(n.arrayValue,t.arrayValue);case 10:return function(o,u){var R,S,x,O;const l=o.fields||{},d=u.fields||{},f=(R=l[us])==null?void 0:R.arrayValue,_=(S=d[us])==null?void 0:S.arrayValue,w=U(((x=f==null?void 0:f.values)==null?void 0:x.length)||0,((O=_==null?void 0:_.values)==null?void 0:O.length)||0);return w!==0?w:wo(f,_)}(n.mapValue,t.mapValue);case 11:return function(o,u){if(o===Bn.mapValue&&u===Bn.mapValue)return 0;if(o===Bn.mapValue)return 1;if(u===Bn.mapValue)return-1;const l=o.fields||{},d=Object.keys(l),f=u.fields||{},_=Object.keys(f);d.sort(),_.sort();for(let w=0;w<d.length&&w<_.length;++w){const R=is(d[w],_[w]);if(R!==0)return R;const S=Pe(l[d[w]],f[_[w]]);if(S!==0)return S}return U(d.length,_.length)}(n.mapValue,t.mapValue);default:throw L(23264,{he:e})}}function vo(n,t){if(typeof n=="string"&&typeof t=="string"&&n.length===t.length)return U(n,t);const e=Xt(n),r=Xt(t),i=U(e.seconds,r.seconds);return i!==0?i:U(e.nanos,r.nanos)}function wo(n,t){const e=n.values||[],r=t.values||[];for(let i=0;i<e.length&&i<r.length;++i){const o=Pe(e[i],r[i]);if(o)return o}return U(e.length,r.length)}function be(n){return cs(n)}function cs(n){return"nullValue"in n?"null":"booleanValue"in n?""+n.booleanValue:"integerValue"in n?""+n.integerValue:"doubleValue"in n?""+n.doubleValue:"timestampValue"in n?function(e){const r=Xt(e);return`time(${r.seconds},${r.nanos})`}(n.timestampValue):"stringValue"in n?n.stringValue:"bytesValue"in n?function(e){return Yt(e).toBase64()}(n.bytesValue):"referenceValue"in n?function(e){return k.fromName(e).toString()}(n.referenceValue):"geoPointValue"in n?function(e){return`geo(${e.latitude},${e.longitude})`}(n.geoPointValue):"arrayValue"in n?function(e){let r="[",i=!0;for(const o of e.values||[])i?i=!1:r+=",",r+=cs(o);return r+"]"}(n.arrayValue):"mapValue"in n?function(e){const r=Object.keys(e.fields||{}).sort();let i="{",o=!0;for(const u of r)o?o=!1:i+=",",i+=`${u}:${cs(e.fields[u])}`;return i+"}"}(n.mapValue):L(61005,{value:n})}function Hn(n){switch(Jt(n)){case 0:case 1:return 4;case 2:return 8;case 3:case 8:return 16;case 4:const t=ur(n);return t?16+Hn(t):16;case 5:return 2*n.stringValue.length;case 6:return Yt(n.bytesValue).approximateByteSize();case 7:return n.referenceValue.length;case 9:return function(r){return(r.values||[]).reduce((i,o)=>i+Hn(o),0)}(n.arrayValue);case 10:case 11:return function(r){let i=0;return En(r.fields,(o,u)=>{i+=o.length+Hn(u)}),i}(n.mapValue);default:throw L(13486,{value:n})}}function ls(n){return!!n&&"integerValue"in n}function bs(n){return!!n&&"arrayValue"in n}function Ao(n){return!!n&&"nullValue"in n}function Ro(n){return!!n&&"doubleValue"in n&&isNaN(Number(n.doubleValue))}function Hr(n){return!!n&&"mapValue"in n}function Ch(n){var e,r;return((r=(((e=n==null?void 0:n.mapValue)==null?void 0:e.fields)||{})[wh])==null?void 0:r.stringValue)===Rh}function sn(n){if(n.geoPointValue)return{geoPointValue:{...n.geoPointValue}};if(n.timestampValue&&typeof n.timestampValue=="object")return{timestampValue:{...n.timestampValue}};if(n.mapValue){const t={mapValue:{fields:{}}};return En(n.mapValue.fields,(e,r)=>t.mapValue.fields[e]=sn(r)),t}if(n.arrayValue){const t={arrayValue:{values:[]}};for(let e=0;e<(n.arrayValue.values||[]).length;++e)t.arrayValue.values[e]=sn(n.arrayValue.values[e]);return t}return{...n}}function Sh(n){return(((n.mapValue||{}).fields||{}).__type__||{}).stringValue===Ah}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pt{constructor(t){this.value=t}static empty(){return new Pt({mapValue:{}})}field(t){if(t.isEmpty())return this.value;{let e=this.value;for(let r=0;r<t.length-1;++r)if(e=(e.mapValue.fields||{})[t.get(r)],!Hr(e))return null;return e=(e.mapValue.fields||{})[t.lastSegment()],e||null}}set(t,e){this.getFieldsMap(t.popLast())[t.lastSegment()]=sn(e)}setAll(t){let e=yt.emptyPath(),r={},i=[];t.forEach((u,l)=>{if(!e.isImmediateParentOf(l)){const d=this.getFieldsMap(e);this.applyChanges(d,r,i),r={},i=[],e=l.popLast()}u?r[l.lastSegment()]=sn(u):i.push(l.lastSegment())});const o=this.getFieldsMap(e);this.applyChanges(o,r,i)}delete(t){const e=this.field(t.popLast());Hr(e)&&e.mapValue.fields&&delete e.mapValue.fields[t.lastSegment()]}isEqual(t){return Dt(this.value,t.value)}getFieldsMap(t){let e=this.value;e.mapValue.fields||(e.mapValue={fields:{}});for(let r=0;r<t.length;++r){let i=e.mapValue.fields[t.get(r)];Hr(i)&&i.mapValue.fields||(i={mapValue:{fields:{}}},e.mapValue.fields[t.get(r)]=i),e=i}return e.mapValue.fields}applyChanges(t,e,r){En(e,(i,o)=>t[i]=o);for(const i of r)delete t[i]}clone(){return new Pt(sn(this.value))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gt{constructor(t,e,r,i,o,u,l){this.key=t,this.documentType=e,this.version=r,this.readTime=i,this.createTime=o,this.data=u,this.documentState=l}static newInvalidDocument(t){return new gt(t,0,M.min(),M.min(),M.min(),Pt.empty(),0)}static newFoundDocument(t,e,r,i){return new gt(t,1,e,M.min(),r,i,0)}static newNoDocument(t,e){return new gt(t,2,e,M.min(),M.min(),Pt.empty(),0)}static newUnknownDocument(t,e){return new gt(t,3,e,M.min(),M.min(),Pt.empty(),2)}convertToFoundDocument(t,e){return!this.createTime.isEqual(M.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=t),this.version=t,this.documentType=1,this.data=e,this.documentState=0,this}convertToNoDocument(t){return this.version=t,this.documentType=2,this.data=Pt.empty(),this.documentState=0,this}convertToUnknownDocument(t){return this.version=t,this.documentType=3,this.data=Pt.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=M.min(),this}setReadTime(t){return this.readTime=t,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(t){return t instanceof gt&&this.key.isEqual(t.key)&&this.version.isEqual(t.version)&&this.documentType===t.documentType&&this.documentState===t.documentState&&this.data.isEqual(t.data)}mutableCopy(){return new gt(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Zn{constructor(t,e){this.position=t,this.inclusive=e}}function Co(n,t,e){let r=0;for(let i=0;i<n.position.length;i++){const o=t[i],u=n.position[i];if(o.field.isKeyField()?r=k.comparator(k.fromName(u.referenceValue),e.key):r=Pe(u,e.data.field(o.field)),o.dir==="desc"&&(r*=-1),r!==0)break}return r}function So(n,t){if(n===null)return t===null;if(t===null||n.inclusive!==t.inclusive||n.position.length!==t.position.length)return!1;for(let e=0;e<n.position.length;e++)if(!Dt(n.position[e],t.position[e]))return!1;return!0}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tr{constructor(t,e="asc"){this.field=t,this.dir=e}}function Ph(n,t){return n.dir===t.dir&&n.field.isEqual(t.field)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Oa{}class it extends Oa{constructor(t,e,r){super(),this.field=t,this.op=e,this.value=r}static create(t,e,r){return t.isKeyField()?e==="in"||e==="not-in"?this.createKeyFieldInFilter(t,e,r):new Vh(t,e,r):e==="array-contains"?new kh(t,r):e==="in"?new xh(t,r):e==="not-in"?new Oh(t,r):e==="array-contains-any"?new Mh(t,r):new it(t,e,r)}static createKeyFieldInFilter(t,e,r){return e==="in"?new Dh(t,r):new Nh(t,r)}matches(t){const e=t.data.field(this.field);return this.op==="!="?e!==null&&e.nullValue===void 0&&this.matchesComparison(Pe(e,this.value)):e!==null&&Jt(this.value)===Jt(e)&&this.matchesComparison(Pe(e,this.value))}matchesComparison(t){switch(this.op){case"<":return t<0;case"<=":return t<=0;case"==":return t===0;case"!=":return t!==0;case">":return t>0;case">=":return t>=0;default:return L(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class Nt extends Oa{constructor(t,e){super(),this.filters=t,this.op=e,this.Pe=null}static create(t,e){return new Nt(t,e)}matches(t){return Ma(this)?this.filters.find(e=>!e.matches(t))===void 0:this.filters.find(e=>e.matches(t))!==void 0}getFlattenedFilters(){return this.Pe!==null||(this.Pe=this.filters.reduce((t,e)=>t.concat(e.getFlattenedFilters()),[])),this.Pe}getFilters(){return Object.assign([],this.filters)}}function Ma(n){return n.op==="and"}function La(n){return bh(n)&&Ma(n)}function bh(n){for(const t of n.filters)if(t instanceof Nt)return!1;return!0}function hs(n){if(n instanceof it)return n.field.canonicalString()+n.op.toString()+be(n.value);if(La(n))return n.filters.map(t=>hs(t)).join(",");{const t=n.filters.map(e=>hs(e)).join(",");return`${n.op}(${t})`}}function Fa(n,t){return n instanceof it?function(r,i){return i instanceof it&&r.op===i.op&&r.field.isEqual(i.field)&&Dt(r.value,i.value)}(n,t):n instanceof Nt?function(r,i){return i instanceof Nt&&r.op===i.op&&r.filters.length===i.filters.length?r.filters.reduce((o,u,l)=>o&&Fa(u,i.filters[l]),!0):!1}(n,t):void L(19439)}function Ua(n){return n instanceof it?function(e){return`${e.field.canonicalString()} ${e.op} ${be(e.value)}`}(n):n instanceof Nt?function(e){return e.op.toString()+" {"+e.getFilters().map(Ua).join(" ,")+"}"}(n):"Filter"}class Vh extends it{constructor(t,e,r){super(t,e,r),this.key=k.fromName(r.referenceValue)}matches(t){const e=k.comparator(t.key,this.key);return this.matchesComparison(e)}}class Dh extends it{constructor(t,e){super(t,"in",e),this.keys=Ba("in",e)}matches(t){return this.keys.some(e=>e.isEqual(t.key))}}class Nh extends it{constructor(t,e){super(t,"not-in",e),this.keys=Ba("not-in",e)}matches(t){return!this.keys.some(e=>e.isEqual(t.key))}}function Ba(n,t){var e;return(((e=t.arrayValue)==null?void 0:e.values)||[]).map(r=>k.fromName(r.referenceValue))}class kh extends it{constructor(t,e){super(t,"array-contains",e)}matches(t){const e=t.data.field(this.field);return bs(e)&&pn(e.arrayValue,this.value)}}class xh extends it{constructor(t,e){super(t,"in",e)}matches(t){const e=t.data.field(this.field);return e!==null&&pn(this.value.arrayValue,e)}}class Oh extends it{constructor(t,e){super(t,"not-in",e)}matches(t){if(pn(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const e=t.data.field(this.field);return e!==null&&e.nullValue===void 0&&!pn(this.value.arrayValue,e)}}class Mh extends it{constructor(t,e){super(t,"array-contains-any",e)}matches(t){const e=t.data.field(this.field);return!(!bs(e)||!e.arrayValue.values)&&e.arrayValue.values.some(r=>pn(this.value.arrayValue,r))}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Lh{constructor(t,e=null,r=[],i=[],o=null,u=null,l=null){this.path=t,this.collectionGroup=e,this.orderBy=r,this.filters=i,this.limit=o,this.startAt=u,this.endAt=l,this.Te=null}}function Po(n,t=null,e=[],r=[],i=null,o=null,u=null){return new Lh(n,t,e,r,i,o,u)}function Vs(n){const t=q(n);if(t.Te===null){let e=t.path.canonicalString();t.collectionGroup!==null&&(e+="|cg:"+t.collectionGroup),e+="|f:",e+=t.filters.map(r=>hs(r)).join(","),e+="|ob:",e+=t.orderBy.map(r=>function(o){return o.field.canonicalString()+o.dir}(r)).join(","),ar(t.limit)||(e+="|l:",e+=t.limit),t.startAt&&(e+="|lb:",e+=t.startAt.inclusive?"b:":"a:",e+=t.startAt.position.map(r=>be(r)).join(",")),t.endAt&&(e+="|ub:",e+=t.endAt.inclusive?"a:":"b:",e+=t.endAt.position.map(r=>be(r)).join(",")),t.Te=e}return t.Te}function Ds(n,t){if(n.limit!==t.limit||n.orderBy.length!==t.orderBy.length)return!1;for(let e=0;e<n.orderBy.length;e++)if(!Ph(n.orderBy[e],t.orderBy[e]))return!1;if(n.filters.length!==t.filters.length)return!1;for(let e=0;e<n.filters.length;e++)if(!Fa(n.filters[e],t.filters[e]))return!1;return n.collectionGroup===t.collectionGroup&&!!n.path.isEqual(t.path)&&!!So(n.startAt,t.startAt)&&So(n.endAt,t.endAt)}function ds(n){return k.isDocumentKey(n.path)&&n.collectionGroup===null&&n.filters.length===0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class cr{constructor(t,e=null,r=[],i=[],o=null,u="F",l=null,d=null){this.path=t,this.collectionGroup=e,this.explicitOrderBy=r,this.filters=i,this.limit=o,this.limitType=u,this.startAt=l,this.endAt=d,this.Ie=null,this.Ee=null,this.de=null,this.startAt,this.endAt}}function Fh(n,t,e,r,i,o,u,l){return new cr(n,t,e,r,i,o,u,l)}function Ns(n){return new cr(n)}function bo(n){return n.filters.length===0&&n.limit===null&&n.startAt==null&&n.endAt==null&&(n.explicitOrderBy.length===0||n.explicitOrderBy.length===1&&n.explicitOrderBy[0].field.isKeyField())}function Uh(n){return n.collectionGroup!==null}function on(n){const t=q(n);if(t.Ie===null){t.Ie=[];const e=new Set;for(const o of t.explicitOrderBy)t.Ie.push(o),e.add(o.field.canonicalString());const r=t.explicitOrderBy.length>0?t.explicitOrderBy[t.explicitOrderBy.length-1].dir:"asc";(function(u){let l=new ot(yt.comparator);return u.filters.forEach(d=>{d.getFlattenedFilters().forEach(f=>{f.isInequality()&&(l=l.add(f.field))})}),l})(t).forEach(o=>{e.has(o.canonicalString())||o.isKeyField()||t.Ie.push(new tr(o,r))}),e.has(yt.keyField().canonicalString())||t.Ie.push(new tr(yt.keyField(),r))}return t.Ie}function Vt(n){const t=q(n);return t.Ee||(t.Ee=Bh(t,on(n))),t.Ee}function Bh(n,t){if(n.limitType==="F")return Po(n.path,n.collectionGroup,t,n.filters,n.limit,n.startAt,n.endAt);{t=t.map(i=>{const o=i.dir==="desc"?"asc":"desc";return new tr(i.field,o)});const e=n.endAt?new Zn(n.endAt.position,n.endAt.inclusive):null,r=n.startAt?new Zn(n.startAt.position,n.startAt.inclusive):null;return Po(n.path,n.collectionGroup,t,n.filters,n.limit,e,r)}}function fs(n,t,e){return new cr(n.path,n.collectionGroup,n.explicitOrderBy.slice(),n.filters.slice(),t,e,n.startAt,n.endAt)}function lr(n,t){return Ds(Vt(n),Vt(t))&&n.limitType===t.limitType}function ja(n){return`${Vs(Vt(n))}|lt:${n.limitType}`}function Te(n){return`Query(target=${function(e){let r=e.path.canonicalString();return e.collectionGroup!==null&&(r+=" collectionGroup="+e.collectionGroup),e.filters.length>0&&(r+=`, filters: [${e.filters.map(i=>Ua(i)).join(", ")}]`),ar(e.limit)||(r+=", limit: "+e.limit),e.orderBy.length>0&&(r+=`, orderBy: [${e.orderBy.map(i=>function(u){return`${u.field.canonicalString()} (${u.dir})`}(i)).join(", ")}]`),e.startAt&&(r+=", startAt: ",r+=e.startAt.inclusive?"b:":"a:",r+=e.startAt.position.map(i=>be(i)).join(",")),e.endAt&&(r+=", endAt: ",r+=e.endAt.inclusive?"a:":"b:",r+=e.endAt.position.map(i=>be(i)).join(",")),`Target(${r})`}(Vt(n))}; limitType=${n.limitType})`}function hr(n,t){return t.isFoundDocument()&&function(r,i){const o=i.key.path;return r.collectionGroup!==null?i.key.hasCollectionId(r.collectionGroup)&&r.path.isPrefixOf(o):k.isDocumentKey(r.path)?r.path.isEqual(o):r.path.isImmediateParentOf(o)}(n,t)&&function(r,i){for(const o of on(r))if(!o.field.isKeyField()&&i.data.field(o.field)===null)return!1;return!0}(n,t)&&function(r,i){for(const o of r.filters)if(!o.matches(i))return!1;return!0}(n,t)&&function(r,i){return!(r.startAt&&!function(u,l,d){const f=Co(u,l,d);return u.inclusive?f<=0:f<0}(r.startAt,on(r),i)||r.endAt&&!function(u,l,d){const f=Co(u,l,d);return u.inclusive?f>=0:f>0}(r.endAt,on(r),i))}(n,t)}function jh(n){return n.collectionGroup||(n.path.length%2==1?n.path.lastSegment():n.path.get(n.path.length-2))}function qa(n){return(t,e)=>{let r=!1;for(const i of on(n)){const o=qh(i,t,e);if(o!==0)return o;r=r||i.field.isKeyField()}return 0}}function qh(n,t,e){const r=n.field.isKeyField()?k.comparator(t.key,e.key):function(o,u,l){const d=u.data.field(o),f=l.data.field(o);return d!==null&&f!==null?Pe(d,f):L(42886)}(n.field,t,e);switch(n.dir){case"asc":return r;case"desc":return-1*r;default:return L(19790,{direction:n.dir})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class me{constructor(t,e){this.mapKeyFn=t,this.equalsFn=e,this.inner={},this.innerSize=0}get(t){const e=this.mapKeyFn(t),r=this.inner[e];if(r!==void 0){for(const[i,o]of r)if(this.equalsFn(i,t))return o}}has(t){return this.get(t)!==void 0}set(t,e){const r=this.mapKeyFn(t),i=this.inner[r];if(i===void 0)return this.inner[r]=[[t,e]],void this.innerSize++;for(let o=0;o<i.length;o++)if(this.equalsFn(i[o][0],t))return void(i[o]=[t,e]);i.push([t,e]),this.innerSize++}delete(t){const e=this.mapKeyFn(t),r=this.inner[e];if(r===void 0)return!1;for(let i=0;i<r.length;i++)if(this.equalsFn(r[i][0],t))return r.length===1?delete this.inner[e]:r.splice(i,1),this.innerSize--,!0;return!1}forEach(t){En(this.inner,(e,r)=>{for(const[i,o]of r)t(i,o)})}isEmpty(){return Th(this.inner)}size(){return this.innerSize}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $h=new Z(k.comparator);function Zt(){return $h}const $a=new Z(k.comparator);function tn(...n){let t=$a;for(const e of n)t=t.insert(e.key,e);return t}function zh(n){let t=$a;return n.forEach((e,r)=>t=t.insert(e,r.overlayedDocument)),t}function ue(){return an()}function za(){return an()}function an(){return new me(n=>n.toString(),(n,t)=>n.isEqual(t))}const Hh=new ot(k.comparator);function $(...n){let t=Hh;for(const e of n)t=t.add(e);return t}const Gh=new ot(U);function Kh(){return Gh}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Qh(n,t){if(n.useProto3Json){if(isNaN(t))return{doubleValue:"NaN"};if(t===1/0)return{doubleValue:"Infinity"};if(t===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:as(t)?"-0":t}}function Wh(n){return{integerValue:""+n}}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class dr{constructor(){this._=void 0}}function Xh(n,t,e){return n instanceof ms?function(i,o){const u={fields:{[Na]:{stringValue:Da},[xa]:{timestampValue:{seconds:i.seconds,nanos:i.nanoseconds}}}};return o&&Ps(o)&&(o=ur(o)),o&&(u.fields[ka]=o),{mapValue:u}}(e,t):n instanceof er?Ha(n,t):n instanceof nr?Ga(n,t):function(i,o){const u=Jh(i,o),l=Vo(u)+Vo(i.Ae);return ls(u)&&ls(i.Ae)?Wh(l):Qh(i.serializer,l)}(n,t)}function Yh(n,t,e){return n instanceof er?Ha(n,t):n instanceof nr?Ga(n,t):e}function Jh(n,t){return n instanceof gs?function(r){return ls(r)||function(o){return!!o&&"doubleValue"in o}(r)}(t)?t:{integerValue:0}:null}class ms extends dr{}class er extends dr{constructor(t){super(),this.elements=t}}function Ha(n,t){const e=Ka(t);for(const r of n.elements)e.some(i=>Dt(i,r))||e.push(r);return{arrayValue:{values:e}}}class nr extends dr{constructor(t){super(),this.elements=t}}function Ga(n,t){let e=Ka(t);for(const r of n.elements)e=e.filter(i=>!Dt(i,r));return{arrayValue:{values:e}}}class gs extends dr{constructor(t,e){super(),this.serializer=t,this.Ae=e}}function Vo(n){return J(n.integerValue||n.doubleValue)}function Ka(n){return bs(n)&&n.arrayValue.values?n.arrayValue.values.slice():[]}function Zh(n,t){return n.field.isEqual(t.field)&&function(r,i){return r instanceof er&&i instanceof er||r instanceof nr&&i instanceof nr?Se(r.elements,i.elements,Dt):r instanceof gs&&i instanceof gs?Dt(r.Ae,i.Ae):r instanceof ms&&i instanceof ms}(n.transform,t.transform)}class le{constructor(t,e){this.updateTime=t,this.exists=e}static none(){return new le}static exists(t){return new le(void 0,t)}static updateTime(t){return new le(t)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(t){return this.exists===t.exists&&(this.updateTime?!!t.updateTime&&this.updateTime.isEqual(t.updateTime):!t.updateTime)}}function Gn(n,t){return n.updateTime!==void 0?t.isFoundDocument()&&t.version.isEqual(n.updateTime):n.exists===void 0||n.exists===t.isFoundDocument()}class ks{}function Qa(n,t){if(!n.hasLocalMutations||t&&t.fields.length===0)return null;if(t===null)return n.isNoDocument()?new ed(n.key,le.none()):new xs(n.key,n.data,le.none());{const e=n.data,r=Pt.empty();let i=new ot(yt.comparator);for(let o of t.fields)if(!i.has(o)){let u=e.field(o);u===null&&o.length>1&&(o=o.popLast(),u=e.field(o)),u===null?r.delete(o):r.set(o,u),i=i.add(o)}return new fr(n.key,r,new qt(i.toArray()),le.none())}}function td(n,t,e){n instanceof xs?function(i,o,u){const l=i.value.clone(),d=No(i.fieldTransforms,o,u.transformResults);l.setAll(d),o.convertToFoundDocument(u.version,l).setHasCommittedMutations()}(n,t,e):n instanceof fr?function(i,o,u){if(!Gn(i.precondition,o))return void o.convertToUnknownDocument(u.version);const l=No(i.fieldTransforms,o,u.transformResults),d=o.data;d.setAll(Wa(i)),d.setAll(l),o.convertToFoundDocument(u.version,d).setHasCommittedMutations()}(n,t,e):function(i,o,u){o.convertToNoDocument(u.version).setHasCommittedMutations()}(0,t,e)}function un(n,t,e,r){return n instanceof xs?function(o,u,l,d){if(!Gn(o.precondition,u))return l;const f=o.value.clone(),_=ko(o.fieldTransforms,d,u);return f.setAll(_),u.convertToFoundDocument(u.version,f).setHasLocalMutations(),null}(n,t,e,r):n instanceof fr?function(o,u,l,d){if(!Gn(o.precondition,u))return l;const f=ko(o.fieldTransforms,d,u),_=u.data;return _.setAll(Wa(o)),_.setAll(f),u.convertToFoundDocument(u.version,_).setHasLocalMutations(),l===null?null:l.unionWith(o.fieldMask.fields).unionWith(o.fieldTransforms.map(w=>w.field))}(n,t,e,r):function(o,u,l){return Gn(o.precondition,u)?(u.convertToNoDocument(u.version).setHasLocalMutations(),null):l}(n,t,e)}function Do(n,t){return n.type===t.type&&!!n.key.isEqual(t.key)&&!!n.precondition.isEqual(t.precondition)&&!!function(r,i){return r===void 0&&i===void 0||!(!r||!i)&&Se(r,i,(o,u)=>Zh(o,u))}(n.fieldTransforms,t.fieldTransforms)&&(n.type===0?n.value.isEqual(t.value):n.type!==1||n.data.isEqual(t.data)&&n.fieldMask.isEqual(t.fieldMask))}class xs extends ks{constructor(t,e,r,i=[]){super(),this.key=t,this.value=e,this.precondition=r,this.fieldTransforms=i,this.type=0}getFieldMask(){return null}}class fr extends ks{constructor(t,e,r,i,o=[]){super(),this.key=t,this.data=e,this.fieldMask=r,this.precondition=i,this.fieldTransforms=o,this.type=1}getFieldMask(){return this.fieldMask}}function Wa(n){const t=new Map;return n.fieldMask.fields.forEach(e=>{if(!e.isEmpty()){const r=n.data.field(e);t.set(e,r)}}),t}function No(n,t,e){const r=new Map;W(n.length===e.length,32656,{Re:e.length,Ve:n.length});for(let i=0;i<e.length;i++){const o=n[i],u=o.transform,l=t.data.field(o.field);r.set(o.field,Yh(u,l,e[i]))}return r}function ko(n,t,e){const r=new Map;for(const i of n){const o=i.transform,u=e.data.field(i.field);r.set(i.field,Xh(o,u,t))}return r}class ed extends ks{constructor(t,e){super(),this.key=t,this.precondition=e,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nd{constructor(t,e,r,i){this.batchId=t,this.localWriteTime=e,this.baseMutations=r,this.mutations=i}applyToRemoteDocument(t,e){const r=e.mutationResults;for(let i=0;i<this.mutations.length;i++){const o=this.mutations[i];o.key.isEqual(t.key)&&td(o,t,r[i])}}applyToLocalView(t,e){for(const r of this.baseMutations)r.key.isEqual(t.key)&&(e=un(r,t,e,this.localWriteTime));for(const r of this.mutations)r.key.isEqual(t.key)&&(e=un(r,t,e,this.localWriteTime));return e}applyToLocalDocumentSet(t,e){const r=za();return this.mutations.forEach(i=>{const o=t.get(i.key),u=o.overlayedDocument;let l=this.applyToLocalView(u,o.mutatedFields);l=e.has(i.key)?null:l;const d=Qa(u,l);d!==null&&r.set(i.key,d),u.isValidDocument()||u.convertToNoDocument(M.min())}),r}keys(){return this.mutations.reduce((t,e)=>t.add(e.key),$())}isEqual(t){return this.batchId===t.batchId&&Se(this.mutations,t.mutations,(e,r)=>Do(e,r))&&Se(this.baseMutations,t.baseMutations,(e,r)=>Do(e,r))}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rd{constructor(t,e){this.largestBatchId=t,this.mutation=e}getKey(){return this.mutation.key}isEqual(t){return t!==null&&this.mutation===t.mutation}toString(){return`Overlay{
      largestBatchId: ${this.largestBatchId},
      mutation: ${this.mutation.toString()}
    }`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sd{constructor(t,e){this.count=t,this.unchangedNames=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var tt,B;function Xa(n){if(n===void 0)return Ot("GRPC error has no .code"),P.UNKNOWN;switch(n){case tt.OK:return P.OK;case tt.CANCELLED:return P.CANCELLED;case tt.UNKNOWN:return P.UNKNOWN;case tt.DEADLINE_EXCEEDED:return P.DEADLINE_EXCEEDED;case tt.RESOURCE_EXHAUSTED:return P.RESOURCE_EXHAUSTED;case tt.INTERNAL:return P.INTERNAL;case tt.UNAVAILABLE:return P.UNAVAILABLE;case tt.UNAUTHENTICATED:return P.UNAUTHENTICATED;case tt.INVALID_ARGUMENT:return P.INVALID_ARGUMENT;case tt.NOT_FOUND:return P.NOT_FOUND;case tt.ALREADY_EXISTS:return P.ALREADY_EXISTS;case tt.PERMISSION_DENIED:return P.PERMISSION_DENIED;case tt.FAILED_PRECONDITION:return P.FAILED_PRECONDITION;case tt.ABORTED:return P.ABORTED;case tt.OUT_OF_RANGE:return P.OUT_OF_RANGE;case tt.UNIMPLEMENTED:return P.UNIMPLEMENTED;case tt.DATA_LOSS:return P.DATA_LOSS;default:return L(39323,{code:n})}}(B=tt||(tt={}))[B.OK=0]="OK",B[B.CANCELLED=1]="CANCELLED",B[B.UNKNOWN=2]="UNKNOWN",B[B.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",B[B.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",B[B.NOT_FOUND=5]="NOT_FOUND",B[B.ALREADY_EXISTS=6]="ALREADY_EXISTS",B[B.PERMISSION_DENIED=7]="PERMISSION_DENIED",B[B.UNAUTHENTICATED=16]="UNAUTHENTICATED",B[B.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",B[B.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",B[B.ABORTED=10]="ABORTED",B[B.OUT_OF_RANGE=11]="OUT_OF_RANGE",B[B.UNIMPLEMENTED=12]="UNIMPLEMENTED",B[B.INTERNAL=13]="INTERNAL",B[B.UNAVAILABLE=14]="UNAVAILABLE",B[B.DATA_LOSS=15]="DATA_LOSS";/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function id(){return new TextEncoder}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const od=new Gt([4294967295,4294967295],0);function xo(n){const t=id().encode(n),e=new Ia;return e.update(t),new Uint8Array(e.digest())}function Oo(n){const t=new DataView(n.buffer),e=t.getUint32(0,!0),r=t.getUint32(4,!0),i=t.getUint32(8,!0),o=t.getUint32(12,!0);return[new Gt([e,r],0),new Gt([i,o],0)]}class Os{constructor(t,e,r){if(this.bitmap=t,this.padding=e,this.hashCount=r,e<0||e>=8)throw new en(`Invalid padding: ${e}`);if(r<0)throw new en(`Invalid hash count: ${r}`);if(t.length>0&&this.hashCount===0)throw new en(`Invalid hash count: ${r}`);if(t.length===0&&e!==0)throw new en(`Invalid padding when bitmap length is 0: ${e}`);this.ge=8*t.length-e,this.pe=Gt.fromNumber(this.ge)}ye(t,e,r){let i=t.add(e.multiply(Gt.fromNumber(r)));return i.compare(od)===1&&(i=new Gt([i.getBits(0),i.getBits(1)],0)),i.modulo(this.pe).toNumber()}we(t){return!!(this.bitmap[Math.floor(t/8)]&1<<t%8)}mightContain(t){if(this.ge===0)return!1;const e=xo(t),[r,i]=Oo(e);for(let o=0;o<this.hashCount;o++){const u=this.ye(r,i,o);if(!this.we(u))return!1}return!0}static create(t,e,r){const i=t%8==0?0:8-t%8,o=new Uint8Array(Math.ceil(t/8)),u=new Os(o,i,e);return r.forEach(l=>u.insert(l)),u}insert(t){if(this.ge===0)return;const e=xo(t),[r,i]=Oo(e);for(let o=0;o<this.hashCount;o++){const u=this.ye(r,i,o);this.Se(u)}}Se(t){const e=Math.floor(t/8),r=t%8;this.bitmap[e]|=1<<r}}class en extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mr{constructor(t,e,r,i,o){this.snapshotVersion=t,this.targetChanges=e,this.targetMismatches=r,this.documentUpdates=i,this.resolvedLimboDocuments=o}static createSynthesizedRemoteEventForCurrentChange(t,e,r){const i=new Map;return i.set(t,Tn.createSynthesizedTargetChangeForCurrentChange(t,e,r)),new mr(M.min(),i,new Z(U),Zt(),$())}}class Tn{constructor(t,e,r,i,o){this.resumeToken=t,this.current=e,this.addedDocuments=r,this.modifiedDocuments=i,this.removedDocuments=o}static createSynthesizedTargetChangeForCurrentChange(t,e,r){return new Tn(r,e,$(),$(),$())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Kn{constructor(t,e,r,i){this.be=t,this.removedTargetIds=e,this.key=r,this.De=i}}class Ya{constructor(t,e){this.targetId=t,this.Ce=e}}class Ja{constructor(t,e,r=ht.EMPTY_BYTE_STRING,i=null){this.state=t,this.targetIds=e,this.resumeToken=r,this.cause=i}}class Mo{constructor(){this.ve=0,this.Fe=Lo(),this.Me=ht.EMPTY_BYTE_STRING,this.xe=!1,this.Oe=!0}get current(){return this.xe}get resumeToken(){return this.Me}get Ne(){return this.ve!==0}get Be(){return this.Oe}Le(t){t.approximateByteSize()>0&&(this.Oe=!0,this.Me=t)}ke(){let t=$(),e=$(),r=$();return this.Fe.forEach((i,o)=>{switch(o){case 0:t=t.add(i);break;case 2:e=e.add(i);break;case 1:r=r.add(i);break;default:L(38017,{changeType:o})}}),new Tn(this.Me,this.xe,t,e,r)}qe(){this.Oe=!1,this.Fe=Lo()}Qe(t,e){this.Oe=!0,this.Fe=this.Fe.insert(t,e)}$e(t){this.Oe=!0,this.Fe=this.Fe.remove(t)}Ue(){this.ve+=1}Ke(){this.ve-=1,W(this.ve>=0,3241,{ve:this.ve})}We(){this.Oe=!0,this.xe=!0}}class ad{constructor(t){this.Ge=t,this.ze=new Map,this.je=Zt(),this.Je=jn(),this.He=jn(),this.Ye=new Z(U)}Ze(t){for(const e of t.be)t.De&&t.De.isFoundDocument()?this.Xe(e,t.De):this.et(e,t.key,t.De);for(const e of t.removedTargetIds)this.et(e,t.key,t.De)}tt(t){this.forEachTarget(t,e=>{const r=this.nt(e);switch(t.state){case 0:this.rt(e)&&r.Le(t.resumeToken);break;case 1:r.Ke(),r.Ne||r.qe(),r.Le(t.resumeToken);break;case 2:r.Ke(),r.Ne||this.removeTarget(e);break;case 3:this.rt(e)&&(r.We(),r.Le(t.resumeToken));break;case 4:this.rt(e)&&(this.it(e),r.Le(t.resumeToken));break;default:L(56790,{state:t.state})}})}forEachTarget(t,e){t.targetIds.length>0?t.targetIds.forEach(e):this.ze.forEach((r,i)=>{this.rt(i)&&e(i)})}st(t){const e=t.targetId,r=t.Ce.count,i=this.ot(e);if(i){const o=i.target;if(ds(o))if(r===0){const u=new k(o.path);this.et(e,u,gt.newNoDocument(u,M.min()))}else W(r===1,20013,{expectedCount:r});else{const u=this._t(e);if(u!==r){const l=this.ut(t),d=l?this.ct(l,t,u):1;if(d!==0){this.it(e);const f=d===2?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.Ye=this.Ye.insert(e,f)}}}}}ut(t){const e=t.Ce.unchangedNames;if(!e||!e.bits)return null;const{bits:{bitmap:r="",padding:i=0},hashCount:o=0}=e;let u,l;try{u=Yt(r).toUint8Array()}catch(d){if(d instanceof Va)return Ce("Decoding the base64 bloom filter in existence filter failed ("+d.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw d}try{l=new Os(u,i,o)}catch(d){return Ce(d instanceof en?"BloomFilter error: ":"Applying bloom filter failed: ",d),null}return l.ge===0?null:l}ct(t,e,r){return e.Ce.count===r-this.Pt(t,e.targetId)?0:2}Pt(t,e){const r=this.Ge.getRemoteKeysForTarget(e);let i=0;return r.forEach(o=>{const u=this.Ge.ht(),l=`projects/${u.projectId}/databases/${u.database}/documents/${o.path.canonicalString()}`;t.mightContain(l)||(this.et(e,o,null),i++)}),i}Tt(t){const e=new Map;this.ze.forEach((o,u)=>{const l=this.ot(u);if(l){if(o.current&&ds(l.target)){const d=new k(l.target.path);this.It(d).has(u)||this.Et(u,d)||this.et(u,d,gt.newNoDocument(d,t))}o.Be&&(e.set(u,o.ke()),o.qe())}});let r=$();this.He.forEach((o,u)=>{let l=!0;u.forEachWhile(d=>{const f=this.ot(d);return!f||f.purpose==="TargetPurposeLimboResolution"||(l=!1,!1)}),l&&(r=r.add(o))}),this.je.forEach((o,u)=>u.setReadTime(t));const i=new mr(t,e,this.Ye,this.je,r);return this.je=Zt(),this.Je=jn(),this.He=jn(),this.Ye=new Z(U),i}Xe(t,e){if(!this.rt(t))return;const r=this.Et(t,e.key)?2:0;this.nt(t).Qe(e.key,r),this.je=this.je.insert(e.key,e),this.Je=this.Je.insert(e.key,this.It(e.key).add(t)),this.He=this.He.insert(e.key,this.dt(e.key).add(t))}et(t,e,r){if(!this.rt(t))return;const i=this.nt(t);this.Et(t,e)?i.Qe(e,1):i.$e(e),this.He=this.He.insert(e,this.dt(e).delete(t)),this.He=this.He.insert(e,this.dt(e).add(t)),r&&(this.je=this.je.insert(e,r))}removeTarget(t){this.ze.delete(t)}_t(t){const e=this.nt(t).ke();return this.Ge.getRemoteKeysForTarget(t).size+e.addedDocuments.size-e.removedDocuments.size}Ue(t){this.nt(t).Ue()}nt(t){let e=this.ze.get(t);return e||(e=new Mo,this.ze.set(t,e)),e}dt(t){let e=this.He.get(t);return e||(e=new ot(U),this.He=this.He.insert(t,e)),e}It(t){let e=this.Je.get(t);return e||(e=new ot(U),this.Je=this.Je.insert(t,e)),e}rt(t){const e=this.ot(t)!==null;return e||V("WatchChangeAggregator","Detected inactive target",t),e}ot(t){const e=this.ze.get(t);return e&&e.Ne?null:this.Ge.At(t)}it(t){this.ze.set(t,new Mo),this.Ge.getRemoteKeysForTarget(t).forEach(e=>{this.et(t,e,null)})}Et(t,e){return this.Ge.getRemoteKeysForTarget(t).has(e)}}function jn(){return new Z(k.comparator)}function Lo(){return new Z(k.comparator)}const ud={asc:"ASCENDING",desc:"DESCENDING"},cd={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},ld={and:"AND",or:"OR"};class hd{constructor(t,e){this.databaseId=t,this.useProto3Json=e}}function ps(n,t){return n.useProto3Json||ar(t)?t:{value:t}}function dd(n,t){return n.useProto3Json?`${new Date(1e3*t.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+t.nanoseconds).slice(-9)}Z`:{seconds:""+t.seconds,nanos:t.nanoseconds}}function fd(n,t){return n.useProto3Json?t.toBase64():t.toUint8Array()}function Ae(n){return W(!!n,49232),M.fromTimestamp(function(e){const r=Xt(e);return new et(r.seconds,r.nanos)}(n))}function md(n,t){return _s(n,t).canonicalString()}function _s(n,t){const e=function(i){return new Q(["projects",i.projectId,"databases",i.database])}(n).child("documents");return t===void 0?e:e.child(t)}function Za(n){const t=Q.fromString(n);return W(su(t),10190,{key:t.toString()}),t}function Gr(n,t){const e=Za(t);if(e.get(1)!==n.databaseId.projectId)throw new N(P.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+e.get(1)+" vs "+n.databaseId.projectId);if(e.get(3)!==n.databaseId.database)throw new N(P.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+e.get(3)+" vs "+n.databaseId.database);return new k(eu(e))}function tu(n,t){return md(n.databaseId,t)}function gd(n){const t=Za(n);return t.length===4?Q.emptyPath():eu(t)}function Fo(n){return new Q(["projects",n.databaseId.projectId,"databases",n.databaseId.database]).canonicalString()}function eu(n){return W(n.length>4&&n.get(4)==="documents",29091,{key:n.toString()}),n.popFirst(5)}function pd(n,t){let e;if("targetChange"in t){t.targetChange;const r=function(f){return f==="NO_CHANGE"?0:f==="ADD"?1:f==="REMOVE"?2:f==="CURRENT"?3:f==="RESET"?4:L(39313,{state:f})}(t.targetChange.targetChangeType||"NO_CHANGE"),i=t.targetChange.targetIds||[],o=function(f,_){return f.useProto3Json?(W(_===void 0||typeof _=="string",58123),ht.fromBase64String(_||"")):(W(_===void 0||_ instanceof Buffer||_ instanceof Uint8Array,16193),ht.fromUint8Array(_||new Uint8Array))}(n,t.targetChange.resumeToken),u=t.targetChange.cause,l=u&&function(f){const _=f.code===void 0?P.UNKNOWN:Xa(f.code);return new N(_,f.message||"")}(u);e=new Ja(r,i,o,l||null)}else if("documentChange"in t){t.documentChange;const r=t.documentChange;r.document,r.document.name,r.document.updateTime;const i=Gr(n,r.document.name),o=Ae(r.document.updateTime),u=r.document.createTime?Ae(r.document.createTime):M.min(),l=new Pt({mapValue:{fields:r.document.fields}}),d=gt.newFoundDocument(i,o,u,l),f=r.targetIds||[],_=r.removedTargetIds||[];e=new Kn(f,_,d.key,d)}else if("documentDelete"in t){t.documentDelete;const r=t.documentDelete;r.document;const i=Gr(n,r.document),o=r.readTime?Ae(r.readTime):M.min(),u=gt.newNoDocument(i,o),l=r.removedTargetIds||[];e=new Kn([],l,u.key,u)}else if("documentRemove"in t){t.documentRemove;const r=t.documentRemove;r.document;const i=Gr(n,r.document),o=r.removedTargetIds||[];e=new Kn([],o,i,null)}else{if(!("filter"in t))return L(11601,{Rt:t});{t.filter;const r=t.filter;r.targetId;const{count:i=0,unchangedNames:o}=r,u=new sd(i,o),l=r.targetId;e=new Ya(l,u)}}return e}function _d(n,t){return{documents:[tu(n,t.path)]}}function yd(n,t){const e={structuredQuery:{}},r=t.path;let i;t.collectionGroup!==null?(i=r,e.structuredQuery.from=[{collectionId:t.collectionGroup,allDescendants:!0}]):(i=r.popLast(),e.structuredQuery.from=[{collectionId:r.lastSegment()}]),e.parent=tu(n,i);const o=function(f){if(f.length!==0)return ru(Nt.create(f,"and"))}(t.filters);o&&(e.structuredQuery.where=o);const u=function(f){if(f.length!==0)return f.map(_=>function(R){return{field:Ie(R.field),direction:Id(R.dir)}}(_))}(t.orderBy);u&&(e.structuredQuery.orderBy=u);const l=ps(n,t.limit);return l!==null&&(e.structuredQuery.limit=l),t.startAt&&(e.structuredQuery.startAt=function(f){return{before:f.inclusive,values:f.position}}(t.startAt)),t.endAt&&(e.structuredQuery.endAt=function(f){return{before:!f.inclusive,values:f.position}}(t.endAt)),{ft:e,parent:i}}function Ed(n){let t=gd(n.parent);const e=n.structuredQuery,r=e.from?e.from.length:0;let i=null;if(r>0){W(r===1,65062);const _=e.from[0];_.allDescendants?i=_.collectionId:t=t.child(_.collectionId)}let o=[];e.where&&(o=function(w){const R=nu(w);return R instanceof Nt&&La(R)?R.getFilters():[R]}(e.where));let u=[];e.orderBy&&(u=function(w){return w.map(R=>function(x){return new tr(ve(x.field),function(D){switch(D){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}}(x.direction))}(R))}(e.orderBy));let l=null;e.limit&&(l=function(w){let R;return R=typeof w=="object"?w.value:w,ar(R)?null:R}(e.limit));let d=null;e.startAt&&(d=function(w){const R=!!w.before,S=w.values||[];return new Zn(S,R)}(e.startAt));let f=null;return e.endAt&&(f=function(w){const R=!w.before,S=w.values||[];return new Zn(S,R)}(e.endAt)),Fh(t,i,u,o,l,"F",d,f)}function Td(n,t){const e=function(i){switch(i){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return L(28987,{purpose:i})}}(t.purpose);return e==null?null:{"goog-listen-tags":e}}function nu(n){return n.unaryFilter!==void 0?function(e){switch(e.unaryFilter.op){case"IS_NAN":const r=ve(e.unaryFilter.field);return it.create(r,"==",{doubleValue:NaN});case"IS_NULL":const i=ve(e.unaryFilter.field);return it.create(i,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const o=ve(e.unaryFilter.field);return it.create(o,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const u=ve(e.unaryFilter.field);return it.create(u,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return L(61313);default:return L(60726)}}(n):n.fieldFilter!==void 0?function(e){return it.create(ve(e.fieldFilter.field),function(i){switch(i){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return L(58110);default:return L(50506)}}(e.fieldFilter.op),e.fieldFilter.value)}(n):n.compositeFilter!==void 0?function(e){return Nt.create(e.compositeFilter.filters.map(r=>nu(r)),function(i){switch(i){case"AND":return"and";case"OR":return"or";default:return L(1026)}}(e.compositeFilter.op))}(n):L(30097,{filter:n})}function Id(n){return ud[n]}function vd(n){return cd[n]}function wd(n){return ld[n]}function Ie(n){return{fieldPath:n.canonicalString()}}function ve(n){return yt.fromServerFormat(n.fieldPath)}function ru(n){return n instanceof it?function(e){if(e.op==="=="){if(Ro(e.value))return{unaryFilter:{field:Ie(e.field),op:"IS_NAN"}};if(Ao(e.value))return{unaryFilter:{field:Ie(e.field),op:"IS_NULL"}}}else if(e.op==="!="){if(Ro(e.value))return{unaryFilter:{field:Ie(e.field),op:"IS_NOT_NAN"}};if(Ao(e.value))return{unaryFilter:{field:Ie(e.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:Ie(e.field),op:vd(e.op),value:e.value}}}(n):n instanceof Nt?function(e){const r=e.getFilters().map(i=>ru(i));return r.length===1?r[0]:{compositeFilter:{op:wd(e.op),filters:r}}}(n):L(54877,{filter:n})}function su(n){return n.length>=4&&n.get(0)==="projects"&&n.get(2)==="databases"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $t{constructor(t,e,r,i,o=M.min(),u=M.min(),l=ht.EMPTY_BYTE_STRING,d=null){this.target=t,this.targetId=e,this.purpose=r,this.sequenceNumber=i,this.snapshotVersion=o,this.lastLimboFreeSnapshotVersion=u,this.resumeToken=l,this.expectedCount=d}withSequenceNumber(t){return new $t(this.target,this.targetId,this.purpose,t,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(t,e){return new $t(this.target,this.targetId,this.purpose,this.sequenceNumber,e,this.lastLimboFreeSnapshotVersion,t,null)}withExpectedCount(t){return new $t(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,t)}withLastLimboFreeSnapshotVersion(t){return new $t(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,t,this.resumeToken,this.expectedCount)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ad{constructor(t){this.yt=t}}function Rd(n){const t=Ed({parent:n.parent,structuredQuery:n.structuredQuery});return n.limitType==="LAST"?fs(t,t.limit,"L"):t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Cd{constructor(){this.Cn=new Sd}addToCollectionParentIndex(t,e){return this.Cn.add(e),C.resolve()}getCollectionParents(t,e){return C.resolve(this.Cn.getEntries(e))}addFieldIndex(t,e){return C.resolve()}deleteFieldIndex(t,e){return C.resolve()}deleteAllFieldIndexes(t){return C.resolve()}createTargetIndexes(t,e){return C.resolve()}getDocumentsMatchingTarget(t,e){return C.resolve(null)}getIndexType(t,e){return C.resolve(0)}getFieldIndexes(t,e){return C.resolve([])}getNextCollectionGroupToUpdate(t){return C.resolve(null)}getMinOffset(t,e){return C.resolve(Wt.min())}getMinOffsetFromCollectionGroup(t,e){return C.resolve(Wt.min())}updateCollectionGroup(t,e,r){return C.resolve()}updateIndexEntries(t,e){return C.resolve()}}class Sd{constructor(){this.index={}}add(t){const e=t.lastSegment(),r=t.popLast(),i=this.index[e]||new ot(Q.comparator),o=!i.has(r);return this.index[e]=i.add(r),o}has(t){const e=t.lastSegment(),r=t.popLast(),i=this.index[e];return i&&i.has(r)}getEntries(t){return(this.index[t]||new ot(Q.comparator)).toArray()}}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Uo={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0},iu=41943040;class It{static withCacheSize(t){return new It(t,It.DEFAULT_COLLECTION_PERCENTILE,It.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(t,e,r){this.cacheSizeCollectionThreshold=t,this.percentileToCollect=e,this.maximumSequenceNumbersToCollect=r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */It.DEFAULT_COLLECTION_PERCENTILE=10,It.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,It.DEFAULT=new It(iu,It.DEFAULT_COLLECTION_PERCENTILE,It.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),It.DISABLED=new It(-1,0,0);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ve{constructor(t){this.ar=t}next(){return this.ar+=2,this.ar}static ur(){return new Ve(0)}static cr(){return new Ve(-1)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Bo="LruGarbageCollector",Pd=1048576;function jo([n,t],[e,r]){const i=U(n,e);return i===0?U(t,r):i}class bd{constructor(t){this.Ir=t,this.buffer=new ot(jo),this.Er=0}dr(){return++this.Er}Ar(t){const e=[t,this.dr()];if(this.buffer.size<this.Ir)this.buffer=this.buffer.add(e);else{const r=this.buffer.last();jo(e,r)<0&&(this.buffer=this.buffer.delete(r).add(e))}}get maxValue(){return this.buffer.last()[0]}}class Vd{constructor(t,e,r){this.garbageCollector=t,this.asyncQueue=e,this.localStore=r,this.Rr=null}start(){this.garbageCollector.params.cacheSizeCollectionThreshold!==-1&&this.Vr(6e4)}stop(){this.Rr&&(this.Rr.cancel(),this.Rr=null)}get started(){return this.Rr!==null}Vr(t){V(Bo,`Garbage collection scheduled in ${t}ms`),this.Rr=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",t,async()=>{this.Rr=null;try{await this.localStore.collectGarbage(this.garbageCollector)}catch(e){Oe(e)?V(Bo,"Ignoring IndexedDB error during garbage collection: ",e):await ir(e)}await this.Vr(3e5)})}}class Dd{constructor(t,e){this.mr=t,this.params=e}calculateTargetCount(t,e){return this.mr.gr(t).next(r=>Math.floor(e/100*r))}nthSequenceNumber(t,e){if(e===0)return C.resolve(or.ce);const r=new bd(e);return this.mr.forEachTarget(t,i=>r.Ar(i.sequenceNumber)).next(()=>this.mr.pr(t,i=>r.Ar(i))).next(()=>r.maxValue)}removeTargets(t,e,r){return this.mr.removeTargets(t,e,r)}removeOrphanedDocuments(t,e){return this.mr.removeOrphanedDocuments(t,e)}collect(t,e){return this.params.cacheSizeCollectionThreshold===-1?(V("LruGarbageCollector","Garbage collection skipped; disabled"),C.resolve(Uo)):this.getCacheSize(t).next(r=>r<this.params.cacheSizeCollectionThreshold?(V("LruGarbageCollector",`Garbage collection skipped; Cache size ${r} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),Uo):this.yr(t,e))}getCacheSize(t){return this.mr.getCacheSize(t)}yr(t,e){let r,i,o,u,l,d,f;const _=Date.now();return this.calculateTargetCount(t,this.params.percentileToCollect).next(w=>(w>this.params.maximumSequenceNumbersToCollect?(V("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${w}`),i=this.params.maximumSequenceNumbersToCollect):i=w,u=Date.now(),this.nthSequenceNumber(t,i))).next(w=>(r=w,l=Date.now(),this.removeTargets(t,r,e))).next(w=>(o=w,d=Date.now(),this.removeOrphanedDocuments(t,r))).next(w=>(f=Date.now(),Ee()<=j.DEBUG&&V("LruGarbageCollector",`LRU Garbage Collection
	Counted targets in ${u-_}ms
	Determined least recently used ${i} in `+(l-u)+`ms
	Removed ${o} targets in `+(d-l)+`ms
	Removed ${w} documents in `+(f-d)+`ms
Total Duration: ${f-_}ms`),C.resolve({didRun:!0,sequenceNumbersCollected:i,targetsRemoved:o,documentsRemoved:w})))}}function Nd(n,t){return new Dd(n,t)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class kd{constructor(){this.changes=new me(t=>t.toString(),(t,e)=>t.isEqual(e)),this.changesApplied=!1}addEntry(t){this.assertNotApplied(),this.changes.set(t.key,t)}removeEntry(t,e){this.assertNotApplied(),this.changes.set(t,gt.newInvalidDocument(t).setReadTime(e))}getEntry(t,e){this.assertNotApplied();const r=this.changes.get(e);return r!==void 0?C.resolve(r):this.getFromCache(t,e)}getEntries(t,e){return this.getAllFromCache(t,e)}apply(t){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(t)}assertNotApplied(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xd{constructor(t,e){this.overlayedDocument=t,this.mutatedFields=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Od{constructor(t,e,r,i){this.remoteDocumentCache=t,this.mutationQueue=e,this.documentOverlayCache=r,this.indexManager=i}getDocument(t,e){let r=null;return this.documentOverlayCache.getOverlay(t,e).next(i=>(r=i,this.remoteDocumentCache.getEntry(t,e))).next(i=>(r!==null&&un(r.mutation,i,qt.empty(),et.now()),i))}getDocuments(t,e){return this.remoteDocumentCache.getEntries(t,e).next(r=>this.getLocalViewOfDocuments(t,r,$()).next(()=>r))}getLocalViewOfDocuments(t,e,r=$()){const i=ue();return this.populateOverlays(t,i,e).next(()=>this.computeViews(t,e,i,r).next(o=>{let u=tn();return o.forEach((l,d)=>{u=u.insert(l,d.overlayedDocument)}),u}))}getOverlayedDocuments(t,e){const r=ue();return this.populateOverlays(t,r,e).next(()=>this.computeViews(t,e,r,$()))}populateOverlays(t,e,r){const i=[];return r.forEach(o=>{e.has(o)||i.push(o)}),this.documentOverlayCache.getOverlays(t,i).next(o=>{o.forEach((u,l)=>{e.set(u,l)})})}computeViews(t,e,r,i){let o=Zt();const u=an(),l=function(){return an()}();return e.forEach((d,f)=>{const _=r.get(f.key);i.has(f.key)&&(_===void 0||_.mutation instanceof fr)?o=o.insert(f.key,f):_!==void 0?(u.set(f.key,_.mutation.getFieldMask()),un(_.mutation,f,_.mutation.getFieldMask(),et.now())):u.set(f.key,qt.empty())}),this.recalculateAndSaveOverlays(t,o).next(d=>(d.forEach((f,_)=>u.set(f,_)),e.forEach((f,_)=>l.set(f,new xd(_,u.get(f)??null))),l))}recalculateAndSaveOverlays(t,e){const r=an();let i=new Z((u,l)=>u-l),o=$();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(t,e).next(u=>{for(const l of u)l.keys().forEach(d=>{const f=e.get(d);if(f===null)return;let _=r.get(d)||qt.empty();_=l.applyToLocalView(f,_),r.set(d,_);const w=(i.get(l.batchId)||$()).add(d);i=i.insert(l.batchId,w)})}).next(()=>{const u=[],l=i.getReverseIterator();for(;l.hasNext();){const d=l.getNext(),f=d.key,_=d.value,w=za();_.forEach(R=>{if(!o.has(R)){const S=Qa(e.get(R),r.get(R));S!==null&&w.set(R,S),o=o.add(R)}}),u.push(this.documentOverlayCache.saveOverlays(t,f,w))}return C.waitFor(u)}).next(()=>r)}recalculateAndSaveOverlaysForDocumentKeys(t,e){return this.remoteDocumentCache.getEntries(t,e).next(r=>this.recalculateAndSaveOverlays(t,r))}getDocumentsMatchingQuery(t,e,r,i){return function(u){return k.isDocumentKey(u.path)&&u.collectionGroup===null&&u.filters.length===0}(e)?this.getDocumentsMatchingDocumentQuery(t,e.path):Uh(e)?this.getDocumentsMatchingCollectionGroupQuery(t,e,r,i):this.getDocumentsMatchingCollectionQuery(t,e,r,i)}getNextDocuments(t,e,r,i){return this.remoteDocumentCache.getAllFromCollectionGroup(t,e,r,i).next(o=>{const u=i-o.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(t,e,r.largestBatchId,i-o.size):C.resolve(ue());let l=fn,d=o;return u.next(f=>C.forEach(f,(_,w)=>(l<w.largestBatchId&&(l=w.largestBatchId),o.get(_)?C.resolve():this.remoteDocumentCache.getEntry(t,_).next(R=>{d=d.insert(_,R)}))).next(()=>this.populateOverlays(t,f,o)).next(()=>this.computeViews(t,d,f,$())).next(_=>({batchId:l,changes:zh(_)})))})}getDocumentsMatchingDocumentQuery(t,e){return this.getDocument(t,new k(e)).next(r=>{let i=tn();return r.isFoundDocument()&&(i=i.insert(r.key,r)),i})}getDocumentsMatchingCollectionGroupQuery(t,e,r,i){const o=e.collectionGroup;let u=tn();return this.indexManager.getCollectionParents(t,o).next(l=>C.forEach(l,d=>{const f=function(w,R){return new cr(R,null,w.explicitOrderBy.slice(),w.filters.slice(),w.limit,w.limitType,w.startAt,w.endAt)}(e,d.child(o));return this.getDocumentsMatchingCollectionQuery(t,f,r,i).next(_=>{_.forEach((w,R)=>{u=u.insert(w,R)})})}).next(()=>u))}getDocumentsMatchingCollectionQuery(t,e,r,i){let o;return this.documentOverlayCache.getOverlaysForCollection(t,e.path,r.largestBatchId).next(u=>(o=u,this.remoteDocumentCache.getDocumentsMatchingQuery(t,e,r,o,i))).next(u=>{o.forEach((d,f)=>{const _=f.getKey();u.get(_)===null&&(u=u.insert(_,gt.newInvalidDocument(_)))});let l=tn();return u.forEach((d,f)=>{const _=o.get(d);_!==void 0&&un(_.mutation,f,qt.empty(),et.now()),hr(e,f)&&(l=l.insert(d,f))}),l})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Md{constructor(t){this.serializer=t,this.Lr=new Map,this.kr=new Map}getBundleMetadata(t,e){return C.resolve(this.Lr.get(e))}saveBundleMetadata(t,e){return this.Lr.set(e.id,function(i){return{id:i.id,version:i.version,createTime:Ae(i.createTime)}}(e)),C.resolve()}getNamedQuery(t,e){return C.resolve(this.kr.get(e))}saveNamedQuery(t,e){return this.kr.set(e.name,function(i){return{name:i.name,query:Rd(i.bundledQuery),readTime:Ae(i.readTime)}}(e)),C.resolve()}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ld{constructor(){this.overlays=new Z(k.comparator),this.qr=new Map}getOverlay(t,e){return C.resolve(this.overlays.get(e))}getOverlays(t,e){const r=ue();return C.forEach(e,i=>this.getOverlay(t,i).next(o=>{o!==null&&r.set(i,o)})).next(()=>r)}saveOverlays(t,e,r){return r.forEach((i,o)=>{this.St(t,e,o)}),C.resolve()}removeOverlaysForBatchId(t,e,r){const i=this.qr.get(r);return i!==void 0&&(i.forEach(o=>this.overlays=this.overlays.remove(o)),this.qr.delete(r)),C.resolve()}getOverlaysForCollection(t,e,r){const i=ue(),o=e.length+1,u=new k(e.child("")),l=this.overlays.getIteratorFrom(u);for(;l.hasNext();){const d=l.getNext().value,f=d.getKey();if(!e.isPrefixOf(f.path))break;f.path.length===o&&d.largestBatchId>r&&i.set(d.getKey(),d)}return C.resolve(i)}getOverlaysForCollectionGroup(t,e,r,i){let o=new Z((f,_)=>f-_);const u=this.overlays.getIterator();for(;u.hasNext();){const f=u.getNext().value;if(f.getKey().getCollectionGroup()===e&&f.largestBatchId>r){let _=o.get(f.largestBatchId);_===null&&(_=ue(),o=o.insert(f.largestBatchId,_)),_.set(f.getKey(),f)}}const l=ue(),d=o.getIterator();for(;d.hasNext()&&(d.getNext().value.forEach((f,_)=>l.set(f,_)),!(l.size()>=i)););return C.resolve(l)}St(t,e,r){const i=this.overlays.get(r.key);if(i!==null){const u=this.qr.get(i.largestBatchId).delete(r.key);this.qr.set(i.largestBatchId,u)}this.overlays=this.overlays.insert(r.key,new rd(e,r));let o=this.qr.get(e);o===void 0&&(o=$(),this.qr.set(e,o)),this.qr.set(e,o.add(r.key))}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fd{constructor(){this.sessionToken=ht.EMPTY_BYTE_STRING}getSessionToken(t){return C.resolve(this.sessionToken)}setSessionToken(t,e){return this.sessionToken=e,C.resolve()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ms{constructor(){this.Qr=new ot(ct.$r),this.Ur=new ot(ct.Kr)}isEmpty(){return this.Qr.isEmpty()}addReference(t,e){const r=new ct(t,e);this.Qr=this.Qr.add(r),this.Ur=this.Ur.add(r)}Wr(t,e){t.forEach(r=>this.addReference(r,e))}removeReference(t,e){this.Gr(new ct(t,e))}zr(t,e){t.forEach(r=>this.removeReference(r,e))}jr(t){const e=new k(new Q([])),r=new ct(e,t),i=new ct(e,t+1),o=[];return this.Ur.forEachInRange([r,i],u=>{this.Gr(u),o.push(u.key)}),o}Jr(){this.Qr.forEach(t=>this.Gr(t))}Gr(t){this.Qr=this.Qr.delete(t),this.Ur=this.Ur.delete(t)}Hr(t){const e=new k(new Q([])),r=new ct(e,t),i=new ct(e,t+1);let o=$();return this.Ur.forEachInRange([r,i],u=>{o=o.add(u.key)}),o}containsKey(t){const e=new ct(t,0),r=this.Qr.firstAfterOrEqual(e);return r!==null&&t.isEqual(r.key)}}class ct{constructor(t,e){this.key=t,this.Yr=e}static $r(t,e){return k.comparator(t.key,e.key)||U(t.Yr,e.Yr)}static Kr(t,e){return U(t.Yr,e.Yr)||k.comparator(t.key,e.key)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ud{constructor(t,e){this.indexManager=t,this.referenceDelegate=e,this.mutationQueue=[],this.tr=1,this.Zr=new ot(ct.$r)}checkEmpty(t){return C.resolve(this.mutationQueue.length===0)}addMutationBatch(t,e,r,i){const o=this.tr;this.tr++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const u=new nd(o,e,r,i);this.mutationQueue.push(u);for(const l of i)this.Zr=this.Zr.add(new ct(l.key,o)),this.indexManager.addToCollectionParentIndex(t,l.key.path.popLast());return C.resolve(u)}lookupMutationBatch(t,e){return C.resolve(this.Xr(e))}getNextMutationBatchAfterBatchId(t,e){const r=e+1,i=this.ei(r),o=i<0?0:i;return C.resolve(this.mutationQueue.length>o?this.mutationQueue[o]:null)}getHighestUnacknowledgedBatchId(){return C.resolve(this.mutationQueue.length===0?_h:this.tr-1)}getAllMutationBatches(t){return C.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(t,e){const r=new ct(e,0),i=new ct(e,Number.POSITIVE_INFINITY),o=[];return this.Zr.forEachInRange([r,i],u=>{const l=this.Xr(u.Yr);o.push(l)}),C.resolve(o)}getAllMutationBatchesAffectingDocumentKeys(t,e){let r=new ot(U);return e.forEach(i=>{const o=new ct(i,0),u=new ct(i,Number.POSITIVE_INFINITY);this.Zr.forEachInRange([o,u],l=>{r=r.add(l.Yr)})}),C.resolve(this.ti(r))}getAllMutationBatchesAffectingQuery(t,e){const r=e.path,i=r.length+1;let o=r;k.isDocumentKey(o)||(o=o.child(""));const u=new ct(new k(o),0);let l=new ot(U);return this.Zr.forEachWhile(d=>{const f=d.key.path;return!!r.isPrefixOf(f)&&(f.length===i&&(l=l.add(d.Yr)),!0)},u),C.resolve(this.ti(l))}ti(t){const e=[];return t.forEach(r=>{const i=this.Xr(r);i!==null&&e.push(i)}),e}removeMutationBatch(t,e){W(this.ni(e.batchId,"removed")===0,55003),this.mutationQueue.shift();let r=this.Zr;return C.forEach(e.mutations,i=>{const o=new ct(i.key,e.batchId);return r=r.delete(o),this.referenceDelegate.markPotentiallyOrphaned(t,i.key)}).next(()=>{this.Zr=r})}ir(t){}containsKey(t,e){const r=new ct(e,0),i=this.Zr.firstAfterOrEqual(r);return C.resolve(e.isEqual(i&&i.key))}performConsistencyCheck(t){return this.mutationQueue.length,C.resolve()}ni(t,e){return this.ei(t)}ei(t){return this.mutationQueue.length===0?0:t-this.mutationQueue[0].batchId}Xr(t){const e=this.ei(t);return e<0||e>=this.mutationQueue.length?null:this.mutationQueue[e]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bd{constructor(t){this.ri=t,this.docs=function(){return new Z(k.comparator)}(),this.size=0}setIndexManager(t){this.indexManager=t}addEntry(t,e){const r=e.key,i=this.docs.get(r),o=i?i.size:0,u=this.ri(e);return this.docs=this.docs.insert(r,{document:e.mutableCopy(),size:u}),this.size+=u-o,this.indexManager.addToCollectionParentIndex(t,r.path.popLast())}removeEntry(t){const e=this.docs.get(t);e&&(this.docs=this.docs.remove(t),this.size-=e.size)}getEntry(t,e){const r=this.docs.get(e);return C.resolve(r?r.document.mutableCopy():gt.newInvalidDocument(e))}getEntries(t,e){let r=Zt();return e.forEach(i=>{const o=this.docs.get(i);r=r.insert(i,o?o.document.mutableCopy():gt.newInvalidDocument(i))}),C.resolve(r)}getDocumentsMatchingQuery(t,e,r,i){let o=Zt();const u=e.path,l=new k(u.child("__id-9223372036854775808__")),d=this.docs.getIteratorFrom(l);for(;d.hasNext();){const{key:f,value:{document:_}}=d.getNext();if(!u.isPrefixOf(f.path))break;f.path.length>u.length+1||fh(dh(_),r)<=0||(i.has(_.key)||hr(e,_))&&(o=o.insert(_.key,_.mutableCopy()))}return C.resolve(o)}getAllFromCollectionGroup(t,e,r,i){L(9500)}ii(t,e){return C.forEach(this.docs,r=>e(r))}newChangeBuffer(t){return new jd(this)}getSize(t){return C.resolve(this.size)}}class jd extends kd{constructor(t){super(),this.Nr=t}applyChanges(t){const e=[];return this.changes.forEach((r,i)=>{i.isValidDocument()?e.push(this.Nr.addEntry(t,i)):this.Nr.removeEntry(r)}),C.waitFor(e)}getFromCache(t,e){return this.Nr.getEntry(t,e)}getAllFromCache(t,e){return this.Nr.getEntries(t,e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qd{constructor(t){this.persistence=t,this.si=new me(e=>Vs(e),Ds),this.lastRemoteSnapshotVersion=M.min(),this.highestTargetId=0,this.oi=0,this._i=new Ms,this.targetCount=0,this.ai=Ve.ur()}forEachTarget(t,e){return this.si.forEach((r,i)=>e(i)),C.resolve()}getLastRemoteSnapshotVersion(t){return C.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(t){return C.resolve(this.oi)}allocateTargetId(t){return this.highestTargetId=this.ai.next(),C.resolve(this.highestTargetId)}setTargetsMetadata(t,e,r){return r&&(this.lastRemoteSnapshotVersion=r),e>this.oi&&(this.oi=e),C.resolve()}Pr(t){this.si.set(t.target,t);const e=t.targetId;e>this.highestTargetId&&(this.ai=new Ve(e),this.highestTargetId=e),t.sequenceNumber>this.oi&&(this.oi=t.sequenceNumber)}addTargetData(t,e){return this.Pr(e),this.targetCount+=1,C.resolve()}updateTargetData(t,e){return this.Pr(e),C.resolve()}removeTargetData(t,e){return this.si.delete(e.target),this._i.jr(e.targetId),this.targetCount-=1,C.resolve()}removeTargets(t,e,r){let i=0;const o=[];return this.si.forEach((u,l)=>{l.sequenceNumber<=e&&r.get(l.targetId)===null&&(this.si.delete(u),o.push(this.removeMatchingKeysForTargetId(t,l.targetId)),i++)}),C.waitFor(o).next(()=>i)}getTargetCount(t){return C.resolve(this.targetCount)}getTargetData(t,e){const r=this.si.get(e)||null;return C.resolve(r)}addMatchingKeys(t,e,r){return this._i.Wr(e,r),C.resolve()}removeMatchingKeys(t,e,r){this._i.zr(e,r);const i=this.persistence.referenceDelegate,o=[];return i&&e.forEach(u=>{o.push(i.markPotentiallyOrphaned(t,u))}),C.waitFor(o)}removeMatchingKeysForTargetId(t,e){return this._i.jr(e),C.resolve()}getMatchingKeysForTargetId(t,e){const r=this._i.Hr(e);return C.resolve(r)}containsKey(t,e){return C.resolve(this._i.containsKey(e))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ou{constructor(t,e){this.ui={},this.overlays={},this.ci=new or(0),this.li=!1,this.li=!0,this.hi=new Fd,this.referenceDelegate=t(this),this.Pi=new qd(this),this.indexManager=new Cd,this.remoteDocumentCache=function(i){return new Bd(i)}(r=>this.referenceDelegate.Ti(r)),this.serializer=new Ad(e),this.Ii=new Md(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.li=!1,Promise.resolve()}get started(){return this.li}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(t){return this.indexManager}getDocumentOverlayCache(t){let e=this.overlays[t.toKey()];return e||(e=new Ld,this.overlays[t.toKey()]=e),e}getMutationQueue(t,e){let r=this.ui[t.toKey()];return r||(r=new Ud(e,this.referenceDelegate),this.ui[t.toKey()]=r),r}getGlobalsCache(){return this.hi}getTargetCache(){return this.Pi}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.Ii}runTransaction(t,e,r){V("MemoryPersistence","Starting transaction:",t);const i=new $d(this.ci.next());return this.referenceDelegate.Ei(),r(i).next(o=>this.referenceDelegate.di(i).next(()=>o)).toPromise().then(o=>(i.raiseOnCommittedEvent(),o))}Ai(t,e){return C.or(Object.values(this.ui).map(r=>()=>r.containsKey(t,e)))}}class $d extends gh{constructor(t){super(),this.currentSequenceNumber=t}}class Ls{constructor(t){this.persistence=t,this.Ri=new Ms,this.Vi=null}static mi(t){return new Ls(t)}get fi(){if(this.Vi)return this.Vi;throw L(60996)}addReference(t,e,r){return this.Ri.addReference(r,e),this.fi.delete(r.toString()),C.resolve()}removeReference(t,e,r){return this.Ri.removeReference(r,e),this.fi.add(r.toString()),C.resolve()}markPotentiallyOrphaned(t,e){return this.fi.add(e.toString()),C.resolve()}removeTarget(t,e){this.Ri.jr(e.targetId).forEach(i=>this.fi.add(i.toString()));const r=this.persistence.getTargetCache();return r.getMatchingKeysForTargetId(t,e.targetId).next(i=>{i.forEach(o=>this.fi.add(o.toString()))}).next(()=>r.removeTargetData(t,e))}Ei(){this.Vi=new Set}di(t){const e=this.persistence.getRemoteDocumentCache().newChangeBuffer();return C.forEach(this.fi,r=>{const i=k.fromPath(r);return this.gi(t,i).next(o=>{o||e.removeEntry(i,M.min())})}).next(()=>(this.Vi=null,e.apply(t)))}updateLimboDocument(t,e){return this.gi(t,e).next(r=>{r?this.fi.delete(e.toString()):this.fi.add(e.toString())})}Ti(t){return 0}gi(t,e){return C.or([()=>C.resolve(this.Ri.containsKey(e)),()=>this.persistence.getTargetCache().containsKey(t,e),()=>this.persistence.Ai(t,e)])}}class rr{constructor(t,e){this.persistence=t,this.pi=new me(r=>yh(r.path),(r,i)=>r.isEqual(i)),this.garbageCollector=Nd(this,e)}static mi(t,e){return new rr(t,e)}Ei(){}di(t){return C.resolve()}forEachTarget(t,e){return this.persistence.getTargetCache().forEachTarget(t,e)}gr(t){const e=this.wr(t);return this.persistence.getTargetCache().getTargetCount(t).next(r=>e.next(i=>r+i))}wr(t){let e=0;return this.pr(t,r=>{e++}).next(()=>e)}pr(t,e){return C.forEach(this.pi,(r,i)=>this.br(t,r,i).next(o=>o?C.resolve():e(i)))}removeTargets(t,e,r){return this.persistence.getTargetCache().removeTargets(t,e,r)}removeOrphanedDocuments(t,e){let r=0;const i=this.persistence.getRemoteDocumentCache(),o=i.newChangeBuffer();return i.ii(t,u=>this.br(t,u,e).next(l=>{l||(r++,o.removeEntry(u,M.min()))})).next(()=>o.apply(t)).next(()=>r)}markPotentiallyOrphaned(t,e){return this.pi.set(e,t.currentSequenceNumber),C.resolve()}removeTarget(t,e){const r=e.withSequenceNumber(t.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(t,r)}addReference(t,e,r){return this.pi.set(r,t.currentSequenceNumber),C.resolve()}removeReference(t,e,r){return this.pi.set(r,t.currentSequenceNumber),C.resolve()}updateLimboDocument(t,e){return this.pi.set(e,t.currentSequenceNumber),C.resolve()}Ti(t){let e=t.key.toString().length;return t.isFoundDocument()&&(e+=Hn(t.data.value)),e}br(t,e,r){return C.or([()=>this.persistence.Ai(t,e),()=>this.persistence.getTargetCache().containsKey(t,e),()=>{const i=this.pi.get(e);return C.resolve(i!==void 0&&i>r)}])}getCacheSize(t){return this.persistence.getRemoteDocumentCache().getSize(t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fs{constructor(t,e,r,i){this.targetId=t,this.fromCache=e,this.Es=r,this.ds=i}static As(t,e){let r=$(),i=$();for(const o of e.docChanges)switch(o.type){case 0:r=r.add(o.doc.key);break;case 1:i=i.add(o.doc.key)}return new Fs(t,e.fromCache,r,i)}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zd{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(t){this._documentReadCount+=t}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Hd{constructor(){this.Rs=!1,this.Vs=!1,this.fs=100,this.gs=function(){return Vc()?8:ph(Pc())>0?6:4}()}initialize(t,e){this.ps=t,this.indexManager=e,this.Rs=!0}getDocumentsMatchingQuery(t,e,r,i){const o={result:null};return this.ys(t,e).next(u=>{o.result=u}).next(()=>{if(!o.result)return this.ws(t,e,i,r).next(u=>{o.result=u})}).next(()=>{if(o.result)return;const u=new zd;return this.Ss(t,e,u).next(l=>{if(o.result=l,this.Vs)return this.bs(t,e,u,l.size)})}).next(()=>o.result)}bs(t,e,r,i){return r.documentReadCount<this.fs?(Ee()<=j.DEBUG&&V("QueryEngine","SDK will not create cache indexes for query:",Te(e),"since it only creates cache indexes for collection contains","more than or equal to",this.fs,"documents"),C.resolve()):(Ee()<=j.DEBUG&&V("QueryEngine","Query:",Te(e),"scans",r.documentReadCount,"local documents and returns",i,"documents as results."),r.documentReadCount>this.gs*i?(Ee()<=j.DEBUG&&V("QueryEngine","The SDK decides to create cache indexes for query:",Te(e),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(t,Vt(e))):C.resolve())}ys(t,e){if(bo(e))return C.resolve(null);let r=Vt(e);return this.indexManager.getIndexType(t,r).next(i=>i===0?null:(e.limit!==null&&i===1&&(e=fs(e,null,"F"),r=Vt(e)),this.indexManager.getDocumentsMatchingTarget(t,r).next(o=>{const u=$(...o);return this.ps.getDocuments(t,u).next(l=>this.indexManager.getMinOffset(t,r).next(d=>{const f=this.Ds(e,l);return this.Cs(e,f,u,d.readTime)?this.ys(t,fs(e,null,"F")):this.vs(t,f,e,d)}))})))}ws(t,e,r,i){return bo(e)||i.isEqual(M.min())?C.resolve(null):this.ps.getDocuments(t,r).next(o=>{const u=this.Ds(e,o);return this.Cs(e,u,r,i)?C.resolve(null):(Ee()<=j.DEBUG&&V("QueryEngine","Re-using previous result from %s to execute query: %s",i.toString(),Te(e)),this.vs(t,u,e,hh(i,fn)).next(l=>l))})}Ds(t,e){let r=new ot(qa(t));return e.forEach((i,o)=>{hr(t,o)&&(r=r.add(o))}),r}Cs(t,e,r,i){if(t.limit===null)return!1;if(r.size!==e.size)return!0;const o=t.limitType==="F"?e.last():e.first();return!!o&&(o.hasPendingWrites||o.version.compareTo(i)>0)}Ss(t,e,r){return Ee()<=j.DEBUG&&V("QueryEngine","Using full collection scan to execute query:",Te(e)),this.ps.getDocumentsMatchingQuery(t,e,Wt.min(),r)}vs(t,e,r,i){return this.ps.getDocumentsMatchingQuery(t,r,i).next(o=>(e.forEach(u=>{o=o.insert(u.key,u)}),o))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Us="LocalStore",Gd=3e8;class Kd{constructor(t,e,r,i){this.persistence=t,this.Fs=e,this.serializer=i,this.Ms=new Z(U),this.xs=new me(o=>Vs(o),Ds),this.Os=new Map,this.Ns=t.getRemoteDocumentCache(),this.Pi=t.getTargetCache(),this.Ii=t.getBundleCache(),this.Bs(r)}Bs(t){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(t),this.indexManager=this.persistence.getIndexManager(t),this.mutationQueue=this.persistence.getMutationQueue(t,this.indexManager),this.localDocuments=new Od(this.Ns,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.Ns.setIndexManager(this.indexManager),this.Fs.initialize(this.localDocuments,this.indexManager)}collectGarbage(t){return this.persistence.runTransaction("Collect garbage","readwrite-primary",e=>t.collect(e,this.Ms))}}function Qd(n,t,e,r){return new Kd(n,t,e,r)}async function au(n,t){const e=q(n);return await e.persistence.runTransaction("Handle user change","readonly",r=>{let i;return e.mutationQueue.getAllMutationBatches(r).next(o=>(i=o,e.Bs(t),e.mutationQueue.getAllMutationBatches(r))).next(o=>{const u=[],l=[];let d=$();for(const f of i){u.push(f.batchId);for(const _ of f.mutations)d=d.add(_.key)}for(const f of o){l.push(f.batchId);for(const _ of f.mutations)d=d.add(_.key)}return e.localDocuments.getDocuments(r,d).next(f=>({Ls:f,removedBatchIds:u,addedBatchIds:l}))})})}function uu(n){const t=q(n);return t.persistence.runTransaction("Get last remote snapshot version","readonly",e=>t.Pi.getLastRemoteSnapshotVersion(e))}function Wd(n,t){const e=q(n),r=t.snapshotVersion;let i=e.Ms;return e.persistence.runTransaction("Apply remote event","readwrite-primary",o=>{const u=e.Ns.newChangeBuffer({trackRemovals:!0});i=e.Ms;const l=[];t.targetChanges.forEach((_,w)=>{const R=i.get(w);if(!R)return;l.push(e.Pi.removeMatchingKeys(o,_.removedDocuments,w).next(()=>e.Pi.addMatchingKeys(o,_.addedDocuments,w)));let S=R.withSequenceNumber(o.currentSequenceNumber);t.targetMismatches.get(w)!==null?S=S.withResumeToken(ht.EMPTY_BYTE_STRING,M.min()).withLastLimboFreeSnapshotVersion(M.min()):_.resumeToken.approximateByteSize()>0&&(S=S.withResumeToken(_.resumeToken,r)),i=i.insert(w,S),function(O,D,X){return O.resumeToken.approximateByteSize()===0||D.snapshotVersion.toMicroseconds()-O.snapshotVersion.toMicroseconds()>=Gd?!0:X.addedDocuments.size+X.modifiedDocuments.size+X.removedDocuments.size>0}(R,S,_)&&l.push(e.Pi.updateTargetData(o,S))});let d=Zt(),f=$();if(t.documentUpdates.forEach(_=>{t.resolvedLimboDocuments.has(_)&&l.push(e.persistence.referenceDelegate.updateLimboDocument(o,_))}),l.push(Xd(o,u,t.documentUpdates).next(_=>{d=_.ks,f=_.qs})),!r.isEqual(M.min())){const _=e.Pi.getLastRemoteSnapshotVersion(o).next(w=>e.Pi.setTargetsMetadata(o,o.currentSequenceNumber,r));l.push(_)}return C.waitFor(l).next(()=>u.apply(o)).next(()=>e.localDocuments.getLocalViewOfDocuments(o,d,f)).next(()=>d)}).then(o=>(e.Ms=i,o))}function Xd(n,t,e){let r=$(),i=$();return e.forEach(o=>r=r.add(o)),t.getEntries(n,r).next(o=>{let u=Zt();return e.forEach((l,d)=>{const f=o.get(l);d.isFoundDocument()!==f.isFoundDocument()&&(i=i.add(l)),d.isNoDocument()&&d.version.isEqual(M.min())?(t.removeEntry(l,d.readTime),u=u.insert(l,d)):!f.isValidDocument()||d.version.compareTo(f.version)>0||d.version.compareTo(f.version)===0&&f.hasPendingWrites?(t.addEntry(d),u=u.insert(l,d)):V(Us,"Ignoring outdated watch update for ",l,". Current version:",f.version," Watch version:",d.version)}),{ks:u,qs:i}})}function Yd(n,t){const e=q(n);return e.persistence.runTransaction("Allocate target","readwrite",r=>{let i;return e.Pi.getTargetData(r,t).next(o=>o?(i=o,C.resolve(i)):e.Pi.allocateTargetId(r).next(u=>(i=new $t(t,u,"TargetPurposeListen",r.currentSequenceNumber),e.Pi.addTargetData(r,i).next(()=>i))))}).then(r=>{const i=e.Ms.get(r.targetId);return(i===null||r.snapshotVersion.compareTo(i.snapshotVersion)>0)&&(e.Ms=e.Ms.insert(r.targetId,r),e.xs.set(t,r.targetId)),r})}async function ys(n,t,e){const r=q(n),i=r.Ms.get(t),o=e?"readwrite":"readwrite-primary";try{e||await r.persistence.runTransaction("Release target",o,u=>r.persistence.referenceDelegate.removeTarget(u,i))}catch(u){if(!Oe(u))throw u;V(Us,`Failed to update sequence numbers for target ${t}: ${u}`)}r.Ms=r.Ms.remove(t),r.xs.delete(i.target)}function qo(n,t,e){const r=q(n);let i=M.min(),o=$();return r.persistence.runTransaction("Execute query","readwrite",u=>function(d,f,_){const w=q(d),R=w.xs.get(_);return R!==void 0?C.resolve(w.Ms.get(R)):w.Pi.getTargetData(f,_)}(r,u,Vt(t)).next(l=>{if(l)return i=l.lastLimboFreeSnapshotVersion,r.Pi.getMatchingKeysForTargetId(u,l.targetId).next(d=>{o=d})}).next(()=>r.Fs.getDocumentsMatchingQuery(u,t,e?i:M.min(),e?o:$())).next(l=>(Jd(r,jh(t),l),{documents:l,Qs:o})))}function Jd(n,t,e){let r=n.Os.get(t)||M.min();e.forEach((i,o)=>{o.readTime.compareTo(r)>0&&(r=o.readTime)}),n.Os.set(t,r)}class $o{constructor(){this.activeTargetIds=Kh()}zs(t){this.activeTargetIds=this.activeTargetIds.add(t)}js(t){this.activeTargetIds=this.activeTargetIds.delete(t)}Gs(){const t={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(t)}}class Zd{constructor(){this.Mo=new $o,this.xo={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(t){}updateMutationState(t,e,r){}addLocalQueryTarget(t,e=!0){return e&&this.Mo.zs(t),this.xo[t]||"not-current"}updateQueryState(t,e,r){this.xo[t]=e}removeLocalQueryTarget(t){this.Mo.js(t)}isLocalQueryTarget(t){return this.Mo.activeTargetIds.has(t)}clearQueryState(t){delete this.xo[t]}getAllActiveQueryTargets(){return this.Mo.activeTargetIds}isActiveQueryTarget(t){return this.Mo.activeTargetIds.has(t)}start(){return this.Mo=new $o,Promise.resolve()}handleUserChange(t,e,r){}setOnlineState(t){}shutdown(){}writeSequenceNumber(t){}notifyBundleLoaded(t){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tf{Oo(t){}shutdown(){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const zo="ConnectivityMonitor";class Ho{constructor(){this.No=()=>this.Bo(),this.Lo=()=>this.ko(),this.qo=[],this.Qo()}Oo(t){this.qo.push(t)}shutdown(){window.removeEventListener("online",this.No),window.removeEventListener("offline",this.Lo)}Qo(){window.addEventListener("online",this.No),window.addEventListener("offline",this.Lo)}Bo(){V(zo,"Network connectivity changed: AVAILABLE");for(const t of this.qo)t(0)}ko(){V(zo,"Network connectivity changed: UNAVAILABLE");for(const t of this.qo)t(1)}static v(){return typeof window<"u"&&window.addEventListener!==void 0&&window.removeEventListener!==void 0}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let qn=null;function Es(){return qn===null?qn=function(){return 268435456+Math.round(2147483648*Math.random())}():qn++,"0x"+qn.toString(16)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Kr="RestConnection",ef={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery"};class nf{get $o(){return!1}constructor(t){this.databaseInfo=t,this.databaseId=t.databaseId;const e=t.ssl?"https":"http",r=encodeURIComponent(this.databaseId.projectId),i=encodeURIComponent(this.databaseId.database);this.Uo=e+"://"+t.host,this.Ko=`projects/${r}/databases/${i}`,this.Wo=this.databaseId.database===Jn?`project_id=${r}`:`project_id=${r}&database_id=${i}`}Go(t,e,r,i,o){const u=Es(),l=this.zo(t,e.toUriEncodedString());V(Kr,`Sending RPC '${t}' ${u}:`,l,r);const d={"google-cloud-resource-prefix":this.Ko,"x-goog-request-params":this.Wo};this.jo(d,i,o);const{host:f}=new URL(l),_=As(f);return this.Jo(t,l,d,r,_).then(w=>(V(Kr,`Received RPC '${t}' ${u}: `,w),w),w=>{throw Ce(Kr,`RPC '${t}' ${u} failed with error: `,w,"url: ",l,"request:",r),w})}Ho(t,e,r,i,o,u){return this.Go(t,e,r,i,o)}jo(t,e,r){t["X-Goog-Api-Client"]=function(){return"gl-js/ fire/"+xe}(),t["Content-Type"]="text/plain",this.databaseInfo.appId&&(t["X-Firebase-GMPID"]=this.databaseInfo.appId),e&&e.headers.forEach((i,o)=>t[o]=i),r&&r.headers.forEach((i,o)=>t[o]=i)}zo(t,e){const r=ef[t];return`${this.Uo}/v1/${e}:${r}`}terminate(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rf{constructor(t){this.Yo=t.Yo,this.Zo=t.Zo}Xo(t){this.e_=t}t_(t){this.n_=t}r_(t){this.i_=t}onMessage(t){this.s_=t}close(){this.Zo()}send(t){this.Yo(t)}o_(){this.e_()}__(){this.n_()}a_(t){this.i_(t)}u_(t){this.s_(t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ft="WebChannelConnection";class sf extends nf{constructor(t){super(t),this.c_=[],this.forceLongPolling=t.forceLongPolling,this.autoDetectLongPolling=t.autoDetectLongPolling,this.useFetchStreams=t.useFetchStreams,this.longPollingOptions=t.longPollingOptions}Jo(t,e,r,i,o){const u=Es();return new Promise((l,d)=>{const f=new va;f.setWithCredentials(!0),f.listenOnce(wa.COMPLETE,()=>{try{switch(f.getLastErrorCode()){case zn.NO_ERROR:const w=f.getResponseJson();V(ft,`XHR for RPC '${t}' ${u} received:`,JSON.stringify(w)),l(w);break;case zn.TIMEOUT:V(ft,`RPC '${t}' ${u} timed out`),d(new N(P.DEADLINE_EXCEEDED,"Request time out"));break;case zn.HTTP_ERROR:const R=f.getStatus();if(V(ft,`RPC '${t}' ${u} failed with status:`,R,"response text:",f.getResponseText()),R>0){let S=f.getResponseJson();Array.isArray(S)&&(S=S[0]);const x=S==null?void 0:S.error;if(x&&x.status&&x.message){const O=function(X){const z=X.toLowerCase().replace(/_/g,"-");return Object.values(P).indexOf(z)>=0?z:P.UNKNOWN}(x.status);d(new N(O,x.message))}else d(new N(P.UNKNOWN,"Server responded with status "+f.getStatus()))}else d(new N(P.UNAVAILABLE,"Connection failed."));break;default:L(9055,{l_:t,streamId:u,h_:f.getLastErrorCode(),P_:f.getLastError()})}}finally{V(ft,`RPC '${t}' ${u} completed.`)}});const _=JSON.stringify(i);V(ft,`RPC '${t}' ${u} sending request:`,i),f.send(e,"POST",_,r,15)})}T_(t,e,r){const i=Es(),o=[this.Uo,"/","google.firestore.v1.Firestore","/",t,"/channel"],u=Ca(),l=Ra(),d={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},f=this.longPollingOptions.timeoutSeconds;f!==void 0&&(d.longPollingTimeout=Math.round(1e3*f)),this.useFetchStreams&&(d.useFetchStreams=!0),this.jo(d.initMessageHeaders,e,r),d.encodeInitMessageHeaders=!0;const _=o.join("");V(ft,`Creating RPC '${t}' stream ${i}: ${_}`,d);const w=u.createWebChannel(_,d);this.I_(w);let R=!1,S=!1;const x=new rf({Yo:D=>{S?V(ft,`Not sending because RPC '${t}' stream ${i} is closed:`,D):(R||(V(ft,`Opening RPC '${t}' stream ${i} transport.`),w.open(),R=!0),V(ft,`RPC '${t}' stream ${i} sending:`,D),w.send(D))},Zo:()=>w.close()}),O=(D,X,z)=>{D.listen(X,G=>{try{z(G)}catch(at){setTimeout(()=>{throw at},0)}})};return O(w,Ze.EventType.OPEN,()=>{S||(V(ft,`RPC '${t}' stream ${i} transport opened.`),x.o_())}),O(w,Ze.EventType.CLOSE,()=>{S||(S=!0,V(ft,`RPC '${t}' stream ${i} transport closed`),x.a_(),this.E_(w))}),O(w,Ze.EventType.ERROR,D=>{S||(S=!0,Ce(ft,`RPC '${t}' stream ${i} transport errored. Name:`,D.name,"Message:",D.message),x.a_(new N(P.UNAVAILABLE,"The operation could not be completed")))}),O(w,Ze.EventType.MESSAGE,D=>{var X;if(!S){const z=D.data[0];W(!!z,16349);const G=z,at=(G==null?void 0:G.error)||((X=G[0])==null?void 0:X.error);if(at){V(ft,`RPC '${t}' stream ${i} received error:`,at);const vt=at.status;let rt=function(p){const T=tt[p];if(T!==void 0)return Xa(T)}(vt),E=at.message;rt===void 0&&(rt=P.INTERNAL,E="Unknown error status: "+vt+" with message "+at.message),S=!0,x.a_(new N(rt,E)),w.close()}else V(ft,`RPC '${t}' stream ${i} received:`,z),x.u_(z)}}),O(l,Aa.STAT_EVENT,D=>{D.stat===ss.PROXY?V(ft,`RPC '${t}' stream ${i} detected buffering proxy`):D.stat===ss.NOPROXY&&V(ft,`RPC '${t}' stream ${i} detected no buffering proxy`)}),setTimeout(()=>{x.__()},0),x}terminate(){this.c_.forEach(t=>t.close()),this.c_=[]}I_(t){this.c_.push(t)}E_(t){this.c_=this.c_.filter(e=>e===t)}}function Qr(){return typeof document<"u"?document:null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function cu(n){return new hd(n,!0)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class lu{constructor(t,e,r=1e3,i=1.5,o=6e4){this.Mi=t,this.timerId=e,this.d_=r,this.A_=i,this.R_=o,this.V_=0,this.m_=null,this.f_=Date.now(),this.reset()}reset(){this.V_=0}g_(){this.V_=this.R_}p_(t){this.cancel();const e=Math.floor(this.V_+this.y_()),r=Math.max(0,Date.now()-this.f_),i=Math.max(0,e-r);i>0&&V("ExponentialBackoff",`Backing off for ${i} ms (base delay: ${this.V_} ms, delay with jitter: ${e} ms, last attempt: ${r} ms ago)`),this.m_=this.Mi.enqueueAfterDelay(this.timerId,i,()=>(this.f_=Date.now(),t())),this.V_*=this.A_,this.V_<this.d_&&(this.V_=this.d_),this.V_>this.R_&&(this.V_=this.R_)}w_(){this.m_!==null&&(this.m_.skipDelay(),this.m_=null)}cancel(){this.m_!==null&&(this.m_.cancel(),this.m_=null)}y_(){return(Math.random()-.5)*this.V_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Go="PersistentStream";class of{constructor(t,e,r,i,o,u,l,d){this.Mi=t,this.S_=r,this.b_=i,this.connection=o,this.authCredentialsProvider=u,this.appCheckCredentialsProvider=l,this.listener=d,this.state=0,this.D_=0,this.C_=null,this.v_=null,this.stream=null,this.F_=0,this.M_=new lu(t,e)}x_(){return this.state===1||this.state===5||this.O_()}O_(){return this.state===2||this.state===3}start(){this.F_=0,this.state!==4?this.auth():this.N_()}async stop(){this.x_()&&await this.close(0)}B_(){this.state=0,this.M_.reset()}L_(){this.O_()&&this.C_===null&&(this.C_=this.Mi.enqueueAfterDelay(this.S_,6e4,()=>this.k_()))}q_(t){this.Q_(),this.stream.send(t)}async k_(){if(this.O_())return this.close(0)}Q_(){this.C_&&(this.C_.cancel(),this.C_=null)}U_(){this.v_&&(this.v_.cancel(),this.v_=null)}async close(t,e){this.Q_(),this.U_(),this.M_.cancel(),this.D_++,t!==4?this.M_.reset():e&&e.code===P.RESOURCE_EXHAUSTED?(Ot(e.toString()),Ot("Using maximum backoff delay to prevent overloading the backend."),this.M_.g_()):e&&e.code===P.UNAUTHENTICATED&&this.state!==3&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),this.stream!==null&&(this.K_(),this.stream.close(),this.stream=null),this.state=t,await this.listener.r_(e)}K_(){}auth(){this.state=1;const t=this.W_(this.D_),e=this.D_;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then(([r,i])=>{this.D_===e&&this.G_(r,i)},r=>{t(()=>{const i=new N(P.UNKNOWN,"Fetching auth token failed: "+r.message);return this.z_(i)})})}G_(t,e){const r=this.W_(this.D_);this.stream=this.j_(t,e),this.stream.Xo(()=>{r(()=>this.listener.Xo())}),this.stream.t_(()=>{r(()=>(this.state=2,this.v_=this.Mi.enqueueAfterDelay(this.b_,1e4,()=>(this.O_()&&(this.state=3),Promise.resolve())),this.listener.t_()))}),this.stream.r_(i=>{r(()=>this.z_(i))}),this.stream.onMessage(i=>{r(()=>++this.F_==1?this.J_(i):this.onNext(i))})}N_(){this.state=5,this.M_.p_(async()=>{this.state=0,this.start()})}z_(t){return V(Go,`close with error: ${t}`),this.stream=null,this.close(4,t)}W_(t){return e=>{this.Mi.enqueueAndForget(()=>this.D_===t?e():(V(Go,"stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve()))}}}class af extends of{constructor(t,e,r,i,o,u){super(t,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",e,r,i,u),this.serializer=o}j_(t,e){return this.connection.T_("Listen",t,e)}J_(t){return this.onNext(t)}onNext(t){this.M_.reset();const e=pd(this.serializer,t),r=function(o){if(!("targetChange"in o))return M.min();const u=o.targetChange;return u.targetIds&&u.targetIds.length?M.min():u.readTime?Ae(u.readTime):M.min()}(t);return this.listener.H_(e,r)}Y_(t){const e={};e.database=Fo(this.serializer),e.addTarget=function(o,u){let l;const d=u.target;if(l=ds(d)?{documents:_d(o,d)}:{query:yd(o,d).ft},l.targetId=u.targetId,u.resumeToken.approximateByteSize()>0){l.resumeToken=fd(o,u.resumeToken);const f=ps(o,u.expectedCount);f!==null&&(l.expectedCount=f)}else if(u.snapshotVersion.compareTo(M.min())>0){l.readTime=dd(o,u.snapshotVersion.toTimestamp());const f=ps(o,u.expectedCount);f!==null&&(l.expectedCount=f)}return l}(this.serializer,t);const r=Td(this.serializer,t);r&&(e.labels=r),this.q_(e)}Z_(t){const e={};e.database=Fo(this.serializer),e.removeTarget=t,this.q_(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class uf{}class cf extends uf{constructor(t,e,r,i){super(),this.authCredentials=t,this.appCheckCredentials=e,this.connection=r,this.serializer=i,this.ia=!1}sa(){if(this.ia)throw new N(P.FAILED_PRECONDITION,"The client has already been terminated.")}Go(t,e,r,i){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([o,u])=>this.connection.Go(t,_s(e,r),i,o,u)).catch(o=>{throw o.name==="FirebaseError"?(o.code===P.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),o):new N(P.UNKNOWN,o.toString())})}Ho(t,e,r,i,o){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([u,l])=>this.connection.Ho(t,_s(e,r),i,u,l,o)).catch(u=>{throw u.name==="FirebaseError"?(u.code===P.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),u):new N(P.UNKNOWN,u.toString())})}terminate(){this.ia=!0,this.connection.terminate()}}class lf{constructor(t,e){this.asyncQueue=t,this.onlineStateHandler=e,this.state="Unknown",this.oa=0,this._a=null,this.aa=!0}ua(){this.oa===0&&(this.ca("Unknown"),this._a=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,()=>(this._a=null,this.la("Backend didn't respond within 10 seconds."),this.ca("Offline"),Promise.resolve())))}ha(t){this.state==="Online"?this.ca("Unknown"):(this.oa++,this.oa>=1&&(this.Pa(),this.la(`Connection failed 1 times. Most recent error: ${t.toString()}`),this.ca("Offline")))}set(t){this.Pa(),this.oa=0,t==="Online"&&(this.aa=!1),this.ca(t)}ca(t){t!==this.state&&(this.state=t,this.onlineStateHandler(t))}la(t){const e=`Could not reach Cloud Firestore backend. ${t}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.aa?(Ot(e),this.aa=!1):V("OnlineStateTracker",e)}Pa(){this._a!==null&&(this._a.cancel(),this._a=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const De="RemoteStore";class hf{constructor(t,e,r,i,o){this.localStore=t,this.datastore=e,this.asyncQueue=r,this.remoteSyncer={},this.Ta=[],this.Ia=new Map,this.Ea=new Set,this.da=[],this.Aa=o,this.Aa.Oo(u=>{r.enqueueAndForget(async()=>{vn(this)&&(V(De,"Restarting streams for network reachability change."),await async function(d){const f=q(d);f.Ea.add(4),await In(f),f.Ra.set("Unknown"),f.Ea.delete(4),await gr(f)}(this))})}),this.Ra=new lf(r,i)}}async function gr(n){if(vn(n))for(const t of n.da)await t(!0)}async function In(n){for(const t of n.da)await t(!1)}function hu(n,t){const e=q(n);e.Ia.has(t.targetId)||(e.Ia.set(t.targetId,t),$s(e)?qs(e):Me(e).O_()&&js(e,t))}function Bs(n,t){const e=q(n),r=Me(e);e.Ia.delete(t),r.O_()&&du(e,t),e.Ia.size===0&&(r.O_()?r.L_():vn(e)&&e.Ra.set("Unknown"))}function js(n,t){if(n.Va.Ue(t.targetId),t.resumeToken.approximateByteSize()>0||t.snapshotVersion.compareTo(M.min())>0){const e=n.remoteSyncer.getRemoteKeysForTarget(t.targetId).size;t=t.withExpectedCount(e)}Me(n).Y_(t)}function du(n,t){n.Va.Ue(t),Me(n).Z_(t)}function qs(n){n.Va=new ad({getRemoteKeysForTarget:t=>n.remoteSyncer.getRemoteKeysForTarget(t),At:t=>n.Ia.get(t)||null,ht:()=>n.datastore.serializer.databaseId}),Me(n).start(),n.Ra.ua()}function $s(n){return vn(n)&&!Me(n).x_()&&n.Ia.size>0}function vn(n){return q(n).Ea.size===0}function fu(n){n.Va=void 0}async function df(n){n.Ra.set("Online")}async function ff(n){n.Ia.forEach((t,e)=>{js(n,t)})}async function mf(n,t){fu(n),$s(n)?(n.Ra.ha(t),qs(n)):n.Ra.set("Unknown")}async function gf(n,t,e){if(n.Ra.set("Online"),t instanceof Ja&&t.state===2&&t.cause)try{await async function(i,o){const u=o.cause;for(const l of o.targetIds)i.Ia.has(l)&&(await i.remoteSyncer.rejectListen(l,u),i.Ia.delete(l),i.Va.removeTarget(l))}(n,t)}catch(r){V(De,"Failed to remove targets %s: %s ",t.targetIds.join(","),r),await Ko(n,r)}else if(t instanceof Kn?n.Va.Ze(t):t instanceof Ya?n.Va.st(t):n.Va.tt(t),!e.isEqual(M.min()))try{const r=await uu(n.localStore);e.compareTo(r)>=0&&await function(o,u){const l=o.Va.Tt(u);return l.targetChanges.forEach((d,f)=>{if(d.resumeToken.approximateByteSize()>0){const _=o.Ia.get(f);_&&o.Ia.set(f,_.withResumeToken(d.resumeToken,u))}}),l.targetMismatches.forEach((d,f)=>{const _=o.Ia.get(d);if(!_)return;o.Ia.set(d,_.withResumeToken(ht.EMPTY_BYTE_STRING,_.snapshotVersion)),du(o,d);const w=new $t(_.target,d,f,_.sequenceNumber);js(o,w)}),o.remoteSyncer.applyRemoteEvent(l)}(n,e)}catch(r){V(De,"Failed to raise snapshot:",r),await Ko(n,r)}}async function Ko(n,t,e){if(!Oe(t))throw t;n.Ea.add(1),await In(n),n.Ra.set("Offline"),e||(e=()=>uu(n.localStore)),n.asyncQueue.enqueueRetryable(async()=>{V(De,"Retrying IndexedDB access"),await e(),n.Ea.delete(1),await gr(n)})}async function Qo(n,t){const e=q(n);e.asyncQueue.verifyOperationInProgress(),V(De,"RemoteStore received new credentials");const r=vn(e);e.Ea.add(3),await In(e),r&&e.Ra.set("Unknown"),await e.remoteSyncer.handleCredentialChange(t),e.Ea.delete(3),await gr(e)}async function pf(n,t){const e=q(n);t?(e.Ea.delete(2),await gr(e)):t||(e.Ea.add(2),await In(e),e.Ra.set("Unknown"))}function Me(n){return n.ma||(n.ma=function(e,r,i){const o=q(e);return o.sa(),new af(r,o.connection,o.authCredentials,o.appCheckCredentials,o.serializer,i)}(n.datastore,n.asyncQueue,{Xo:df.bind(null,n),t_:ff.bind(null,n),r_:mf.bind(null,n),H_:gf.bind(null,n)}),n.da.push(async t=>{t?(n.ma.B_(),$s(n)?qs(n):n.Ra.set("Unknown")):(await n.ma.stop(),fu(n))})),n.ma}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zs{constructor(t,e,r,i,o){this.asyncQueue=t,this.timerId=e,this.targetTimeMs=r,this.op=i,this.removalCallback=o,this.deferred=new ce,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch(u=>{})}get promise(){return this.deferred.promise}static createAndSchedule(t,e,r,i,o){const u=Date.now()+r,l=new zs(t,e,u,i,o);return l.start(r),l}start(t){this.timerHandle=setTimeout(()=>this.handleDelayElapsed(),t)}skipDelay(){return this.handleDelayElapsed()}cancel(t){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new N(P.CANCELLED,"Operation cancelled"+(t?": "+t:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget(()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then(t=>this.deferred.resolve(t))):Promise.resolve())}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function mu(n,t){if(Ot("AsyncQueue",`${t}: ${n}`),Oe(n))return new N(P.UNAVAILABLE,`${t}: ${n}`);throw n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Re{static emptySet(t){return new Re(t.comparator)}constructor(t){this.comparator=t?(e,r)=>t(e,r)||k.comparator(e.key,r.key):(e,r)=>k.comparator(e.key,r.key),this.keyedMap=tn(),this.sortedSet=new Z(this.comparator)}has(t){return this.keyedMap.get(t)!=null}get(t){return this.keyedMap.get(t)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(t){const e=this.keyedMap.get(t);return e?this.sortedSet.indexOf(e):-1}get size(){return this.sortedSet.size}forEach(t){this.sortedSet.inorderTraversal((e,r)=>(t(e),!1))}add(t){const e=this.delete(t.key);return e.copy(e.keyedMap.insert(t.key,t),e.sortedSet.insert(t,null))}delete(t){const e=this.get(t);return e?this.copy(this.keyedMap.remove(t),this.sortedSet.remove(e)):this}isEqual(t){if(!(t instanceof Re)||this.size!==t.size)return!1;const e=this.sortedSet.getIterator(),r=t.sortedSet.getIterator();for(;e.hasNext();){const i=e.getNext().key,o=r.getNext().key;if(!i.isEqual(o))return!1}return!0}toString(){const t=[];return this.forEach(e=>{t.push(e.toString())}),t.length===0?"DocumentSet ()":`DocumentSet (
  `+t.join(`  
`)+`
)`}copy(t,e){const r=new Re;return r.comparator=this.comparator,r.keyedMap=t,r.sortedSet=e,r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wo{constructor(){this.ga=new Z(k.comparator)}track(t){const e=t.doc.key,r=this.ga.get(e);r?t.type!==0&&r.type===3?this.ga=this.ga.insert(e,t):t.type===3&&r.type!==1?this.ga=this.ga.insert(e,{type:r.type,doc:t.doc}):t.type===2&&r.type===2?this.ga=this.ga.insert(e,{type:2,doc:t.doc}):t.type===2&&r.type===0?this.ga=this.ga.insert(e,{type:0,doc:t.doc}):t.type===1&&r.type===0?this.ga=this.ga.remove(e):t.type===1&&r.type===2?this.ga=this.ga.insert(e,{type:1,doc:r.doc}):t.type===0&&r.type===1?this.ga=this.ga.insert(e,{type:2,doc:t.doc}):L(63341,{Rt:t,pa:r}):this.ga=this.ga.insert(e,t)}ya(){const t=[];return this.ga.inorderTraversal((e,r)=>{t.push(r)}),t}}class Ne{constructor(t,e,r,i,o,u,l,d,f){this.query=t,this.docs=e,this.oldDocs=r,this.docChanges=i,this.mutatedKeys=o,this.fromCache=u,this.syncStateChanged=l,this.excludesMetadataChanges=d,this.hasCachedResults=f}static fromInitialDocuments(t,e,r,i,o){const u=[];return e.forEach(l=>{u.push({type:0,doc:l})}),new Ne(t,e,Re.emptySet(e),u,r,i,!0,!1,o)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(t){if(!(this.fromCache===t.fromCache&&this.hasCachedResults===t.hasCachedResults&&this.syncStateChanged===t.syncStateChanged&&this.mutatedKeys.isEqual(t.mutatedKeys)&&lr(this.query,t.query)&&this.docs.isEqual(t.docs)&&this.oldDocs.isEqual(t.oldDocs)))return!1;const e=this.docChanges,r=t.docChanges;if(e.length!==r.length)return!1;for(let i=0;i<e.length;i++)if(e[i].type!==r[i].type||!e[i].doc.isEqual(r[i].doc))return!1;return!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _f{constructor(){this.wa=void 0,this.Sa=[]}ba(){return this.Sa.some(t=>t.Da())}}class yf{constructor(){this.queries=Xo(),this.onlineState="Unknown",this.Ca=new Set}terminate(){(function(e,r){const i=q(e),o=i.queries;i.queries=Xo(),o.forEach((u,l)=>{for(const d of l.Sa)d.onError(r)})})(this,new N(P.ABORTED,"Firestore shutting down"))}}function Xo(){return new me(n=>ja(n),lr)}async function Ef(n,t){const e=q(n);let r=3;const i=t.query;let o=e.queries.get(i);o?!o.ba()&&t.Da()&&(r=2):(o=new _f,r=t.Da()?0:1);try{switch(r){case 0:o.wa=await e.onListen(i,!0);break;case 1:o.wa=await e.onListen(i,!1);break;case 2:await e.onFirstRemoteStoreListen(i)}}catch(u){const l=mu(u,`Initialization of query '${Te(t.query)}' failed`);return void t.onError(l)}e.queries.set(i,o),o.Sa.push(t),t.va(e.onlineState),o.wa&&t.Fa(o.wa)&&Hs(e)}async function Tf(n,t){const e=q(n),r=t.query;let i=3;const o=e.queries.get(r);if(o){const u=o.Sa.indexOf(t);u>=0&&(o.Sa.splice(u,1),o.Sa.length===0?i=t.Da()?0:1:!o.ba()&&t.Da()&&(i=2))}switch(i){case 0:return e.queries.delete(r),e.onUnlisten(r,!0);case 1:return e.queries.delete(r),e.onUnlisten(r,!1);case 2:return e.onLastRemoteStoreUnlisten(r);default:return}}function If(n,t){const e=q(n);let r=!1;for(const i of t){const o=i.query,u=e.queries.get(o);if(u){for(const l of u.Sa)l.Fa(i)&&(r=!0);u.wa=i}}r&&Hs(e)}function vf(n,t,e){const r=q(n),i=r.queries.get(t);if(i)for(const o of i.Sa)o.onError(e);r.queries.delete(t)}function Hs(n){n.Ca.forEach(t=>{t.next()})}var Ts,Yo;(Yo=Ts||(Ts={})).Ma="default",Yo.Cache="cache";class wf{constructor(t,e,r){this.query=t,this.xa=e,this.Oa=!1,this.Na=null,this.onlineState="Unknown",this.options=r||{}}Fa(t){if(!this.options.includeMetadataChanges){const r=[];for(const i of t.docChanges)i.type!==3&&r.push(i);t=new Ne(t.query,t.docs,t.oldDocs,r,t.mutatedKeys,t.fromCache,t.syncStateChanged,!0,t.hasCachedResults)}let e=!1;return this.Oa?this.Ba(t)&&(this.xa.next(t),e=!0):this.La(t,this.onlineState)&&(this.ka(t),e=!0),this.Na=t,e}onError(t){this.xa.error(t)}va(t){this.onlineState=t;let e=!1;return this.Na&&!this.Oa&&this.La(this.Na,t)&&(this.ka(this.Na),e=!0),e}La(t,e){if(!t.fromCache||!this.Da())return!0;const r=e!=="Offline";return(!this.options.qa||!r)&&(!t.docs.isEmpty()||t.hasCachedResults||e==="Offline")}Ba(t){if(t.docChanges.length>0)return!0;const e=this.Na&&this.Na.hasPendingWrites!==t.hasPendingWrites;return!(!t.syncStateChanged&&!e)&&this.options.includeMetadataChanges===!0}ka(t){t=Ne.fromInitialDocuments(t.query,t.docs,t.mutatedKeys,t.fromCache,t.hasCachedResults),this.Oa=!0,this.xa.next(t)}Da(){return this.options.source!==Ts.Cache}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gu{constructor(t){this.key=t}}class pu{constructor(t){this.key=t}}class Af{constructor(t,e){this.query=t,this.Ya=e,this.Za=null,this.hasCachedResults=!1,this.current=!1,this.Xa=$(),this.mutatedKeys=$(),this.eu=qa(t),this.tu=new Re(this.eu)}get nu(){return this.Ya}ru(t,e){const r=e?e.iu:new Wo,i=e?e.tu:this.tu;let o=e?e.mutatedKeys:this.mutatedKeys,u=i,l=!1;const d=this.query.limitType==="F"&&i.size===this.query.limit?i.last():null,f=this.query.limitType==="L"&&i.size===this.query.limit?i.first():null;if(t.inorderTraversal((_,w)=>{const R=i.get(_),S=hr(this.query,w)?w:null,x=!!R&&this.mutatedKeys.has(R.key),O=!!S&&(S.hasLocalMutations||this.mutatedKeys.has(S.key)&&S.hasCommittedMutations);let D=!1;R&&S?R.data.isEqual(S.data)?x!==O&&(r.track({type:3,doc:S}),D=!0):this.su(R,S)||(r.track({type:2,doc:S}),D=!0,(d&&this.eu(S,d)>0||f&&this.eu(S,f)<0)&&(l=!0)):!R&&S?(r.track({type:0,doc:S}),D=!0):R&&!S&&(r.track({type:1,doc:R}),D=!0,(d||f)&&(l=!0)),D&&(S?(u=u.add(S),o=O?o.add(_):o.delete(_)):(u=u.delete(_),o=o.delete(_)))}),this.query.limit!==null)for(;u.size>this.query.limit;){const _=this.query.limitType==="F"?u.last():u.first();u=u.delete(_.key),o=o.delete(_.key),r.track({type:1,doc:_})}return{tu:u,iu:r,Cs:l,mutatedKeys:o}}su(t,e){return t.hasLocalMutations&&e.hasCommittedMutations&&!e.hasLocalMutations}applyChanges(t,e,r,i){const o=this.tu;this.tu=t.tu,this.mutatedKeys=t.mutatedKeys;const u=t.iu.ya();u.sort((_,w)=>function(S,x){const O=D=>{switch(D){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return L(20277,{Rt:D})}};return O(S)-O(x)}(_.type,w.type)||this.eu(_.doc,w.doc)),this.ou(r),i=i??!1;const l=e&&!i?this._u():[],d=this.Xa.size===0&&this.current&&!i?1:0,f=d!==this.Za;return this.Za=d,u.length!==0||f?{snapshot:new Ne(this.query,t.tu,o,u,t.mutatedKeys,d===0,f,!1,!!r&&r.resumeToken.approximateByteSize()>0),au:l}:{au:l}}va(t){return this.current&&t==="Offline"?(this.current=!1,this.applyChanges({tu:this.tu,iu:new Wo,mutatedKeys:this.mutatedKeys,Cs:!1},!1)):{au:[]}}uu(t){return!this.Ya.has(t)&&!!this.tu.has(t)&&!this.tu.get(t).hasLocalMutations}ou(t){t&&(t.addedDocuments.forEach(e=>this.Ya=this.Ya.add(e)),t.modifiedDocuments.forEach(e=>{}),t.removedDocuments.forEach(e=>this.Ya=this.Ya.delete(e)),this.current=t.current)}_u(){if(!this.current)return[];const t=this.Xa;this.Xa=$(),this.tu.forEach(r=>{this.uu(r.key)&&(this.Xa=this.Xa.add(r.key))});const e=[];return t.forEach(r=>{this.Xa.has(r)||e.push(new pu(r))}),this.Xa.forEach(r=>{t.has(r)||e.push(new gu(r))}),e}cu(t){this.Ya=t.Qs,this.Xa=$();const e=this.ru(t.documents);return this.applyChanges(e,!0)}lu(){return Ne.fromInitialDocuments(this.query,this.tu,this.mutatedKeys,this.Za===0,this.hasCachedResults)}}const Gs="SyncEngine";class Rf{constructor(t,e,r){this.query=t,this.targetId=e,this.view=r}}class Cf{constructor(t){this.key=t,this.hu=!1}}class Sf{constructor(t,e,r,i,o,u){this.localStore=t,this.remoteStore=e,this.eventManager=r,this.sharedClientState=i,this.currentUser=o,this.maxConcurrentLimboResolutions=u,this.Pu={},this.Tu=new me(l=>ja(l),lr),this.Iu=new Map,this.Eu=new Set,this.du=new Z(k.comparator),this.Au=new Map,this.Ru=new Ms,this.Vu={},this.mu=new Map,this.fu=Ve.cr(),this.onlineState="Unknown",this.gu=void 0}get isPrimaryClient(){return this.gu===!0}}async function Pf(n,t,e=!0){const r=Iu(n);let i;const o=r.Tu.get(t);return o?(r.sharedClientState.addLocalQueryTarget(o.targetId),i=o.view.lu()):i=await _u(r,t,e,!0),i}async function bf(n,t){const e=Iu(n);await _u(e,t,!0,!1)}async function _u(n,t,e,r){const i=await Yd(n.localStore,Vt(t)),o=i.targetId,u=n.sharedClientState.addLocalQueryTarget(o,e);let l;return r&&(l=await Vf(n,t,o,u==="current",i.resumeToken)),n.isPrimaryClient&&e&&hu(n.remoteStore,i),l}async function Vf(n,t,e,r,i){n.pu=(w,R,S)=>async function(O,D,X,z){let G=D.view.ru(X);G.Cs&&(G=await qo(O.localStore,D.query,!1).then(({documents:E})=>D.view.ru(E,G)));const at=z&&z.targetChanges.get(D.targetId),vt=z&&z.targetMismatches.get(D.targetId)!=null,rt=D.view.applyChanges(G,O.isPrimaryClient,at,vt);return Zo(O,D.targetId,rt.au),rt.snapshot}(n,w,R,S);const o=await qo(n.localStore,t,!0),u=new Af(t,o.Qs),l=u.ru(o.documents),d=Tn.createSynthesizedTargetChangeForCurrentChange(e,r&&n.onlineState!=="Offline",i),f=u.applyChanges(l,n.isPrimaryClient,d);Zo(n,e,f.au);const _=new Rf(t,e,u);return n.Tu.set(t,_),n.Iu.has(e)?n.Iu.get(e).push(t):n.Iu.set(e,[t]),f.snapshot}async function Df(n,t,e){const r=q(n),i=r.Tu.get(t),o=r.Iu.get(i.targetId);if(o.length>1)return r.Iu.set(i.targetId,o.filter(u=>!lr(u,t))),void r.Tu.delete(t);r.isPrimaryClient?(r.sharedClientState.removeLocalQueryTarget(i.targetId),r.sharedClientState.isActiveQueryTarget(i.targetId)||await ys(r.localStore,i.targetId,!1).then(()=>{r.sharedClientState.clearQueryState(i.targetId),e&&Bs(r.remoteStore,i.targetId),Is(r,i.targetId)}).catch(ir)):(Is(r,i.targetId),await ys(r.localStore,i.targetId,!0))}async function Nf(n,t){const e=q(n),r=e.Tu.get(t),i=e.Iu.get(r.targetId);e.isPrimaryClient&&i.length===1&&(e.sharedClientState.removeLocalQueryTarget(r.targetId),Bs(e.remoteStore,r.targetId))}async function yu(n,t){const e=q(n);try{const r=await Wd(e.localStore,t);t.targetChanges.forEach((i,o)=>{const u=e.Au.get(o);u&&(W(i.addedDocuments.size+i.modifiedDocuments.size+i.removedDocuments.size<=1,22616),i.addedDocuments.size>0?u.hu=!0:i.modifiedDocuments.size>0?W(u.hu,14607):i.removedDocuments.size>0&&(W(u.hu,42227),u.hu=!1))}),await Tu(e,r,t)}catch(r){await ir(r)}}function Jo(n,t,e){const r=q(n);if(r.isPrimaryClient&&e===0||!r.isPrimaryClient&&e===1){const i=[];r.Tu.forEach((o,u)=>{const l=u.view.va(t);l.snapshot&&i.push(l.snapshot)}),function(u,l){const d=q(u);d.onlineState=l;let f=!1;d.queries.forEach((_,w)=>{for(const R of w.Sa)R.va(l)&&(f=!0)}),f&&Hs(d)}(r.eventManager,t),i.length&&r.Pu.H_(i),r.onlineState=t,r.isPrimaryClient&&r.sharedClientState.setOnlineState(t)}}async function kf(n,t,e){const r=q(n);r.sharedClientState.updateQueryState(t,"rejected",e);const i=r.Au.get(t),o=i&&i.key;if(o){let u=new Z(k.comparator);u=u.insert(o,gt.newNoDocument(o,M.min()));const l=$().add(o),d=new mr(M.min(),new Map,new Z(U),u,l);await yu(r,d),r.du=r.du.remove(o),r.Au.delete(t),Ks(r)}else await ys(r.localStore,t,!1).then(()=>Is(r,t,e)).catch(ir)}function Is(n,t,e=null){n.sharedClientState.removeLocalQueryTarget(t);for(const r of n.Iu.get(t))n.Tu.delete(r),e&&n.Pu.yu(r,e);n.Iu.delete(t),n.isPrimaryClient&&n.Ru.jr(t).forEach(r=>{n.Ru.containsKey(r)||Eu(n,r)})}function Eu(n,t){n.Eu.delete(t.path.canonicalString());const e=n.du.get(t);e!==null&&(Bs(n.remoteStore,e),n.du=n.du.remove(t),n.Au.delete(e),Ks(n))}function Zo(n,t,e){for(const r of e)r instanceof gu?(n.Ru.addReference(r.key,t),xf(n,r)):r instanceof pu?(V(Gs,"Document no longer in limbo: "+r.key),n.Ru.removeReference(r.key,t),n.Ru.containsKey(r.key)||Eu(n,r.key)):L(19791,{wu:r})}function xf(n,t){const e=t.key,r=e.path.canonicalString();n.du.get(e)||n.Eu.has(r)||(V(Gs,"New document in limbo: "+e),n.Eu.add(r),Ks(n))}function Ks(n){for(;n.Eu.size>0&&n.du.size<n.maxConcurrentLimboResolutions;){const t=n.Eu.values().next().value;n.Eu.delete(t);const e=new k(Q.fromString(t)),r=n.fu.next();n.Au.set(r,new Cf(e)),n.du=n.du.insert(e,r),hu(n.remoteStore,new $t(Vt(Ns(e.path)),r,"TargetPurposeLimboResolution",or.ce))}}async function Tu(n,t,e){const r=q(n),i=[],o=[],u=[];r.Tu.isEmpty()||(r.Tu.forEach((l,d)=>{u.push(r.pu(d,t,e).then(f=>{var _;if((f||e)&&r.isPrimaryClient){const w=f?!f.fromCache:(_=e==null?void 0:e.targetChanges.get(d.targetId))==null?void 0:_.current;r.sharedClientState.updateQueryState(d.targetId,w?"current":"not-current")}if(f){i.push(f);const w=Fs.As(d.targetId,f);o.push(w)}}))}),await Promise.all(u),r.Pu.H_(i),await async function(d,f){const _=q(d);try{await _.persistence.runTransaction("notifyLocalViewChanges","readwrite",w=>C.forEach(f,R=>C.forEach(R.Es,S=>_.persistence.referenceDelegate.addReference(w,R.targetId,S)).next(()=>C.forEach(R.ds,S=>_.persistence.referenceDelegate.removeReference(w,R.targetId,S)))))}catch(w){if(!Oe(w))throw w;V(Us,"Failed to update sequence numbers: "+w)}for(const w of f){const R=w.targetId;if(!w.fromCache){const S=_.Ms.get(R),x=S.snapshotVersion,O=S.withLastLimboFreeSnapshotVersion(x);_.Ms=_.Ms.insert(R,O)}}}(r.localStore,o))}async function Of(n,t){const e=q(n);if(!e.currentUser.isEqual(t)){V(Gs,"User change. New user:",t.toKey());const r=await au(e.localStore,t);e.currentUser=t,function(o,u){o.mu.forEach(l=>{l.forEach(d=>{d.reject(new N(P.CANCELLED,u))})}),o.mu.clear()}(e,"'waitForPendingWrites' promise is rejected due to a user change."),e.sharedClientState.handleUserChange(t,r.removedBatchIds,r.addedBatchIds),await Tu(e,r.Ls)}}function Mf(n,t){const e=q(n),r=e.Au.get(t);if(r&&r.hu)return $().add(r.key);{let i=$();const o=e.Iu.get(t);if(!o)return i;for(const u of o){const l=e.Tu.get(u);i=i.unionWith(l.view.nu)}return i}}function Iu(n){const t=q(n);return t.remoteStore.remoteSyncer.applyRemoteEvent=yu.bind(null,t),t.remoteStore.remoteSyncer.getRemoteKeysForTarget=Mf.bind(null,t),t.remoteStore.remoteSyncer.rejectListen=kf.bind(null,t),t.Pu.H_=If.bind(null,t.eventManager),t.Pu.yu=vf.bind(null,t.eventManager),t}class sr{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(t){this.serializer=cu(t.databaseInfo.databaseId),this.sharedClientState=this.Du(t),this.persistence=this.Cu(t),await this.persistence.start(),this.localStore=this.vu(t),this.gcScheduler=this.Fu(t,this.localStore),this.indexBackfillerScheduler=this.Mu(t,this.localStore)}Fu(t,e){return null}Mu(t,e){return null}vu(t){return Qd(this.persistence,new Hd,t.initialUser,this.serializer)}Cu(t){return new ou(Ls.mi,this.serializer)}Du(t){return new Zd}async terminate(){var t,e;(t=this.gcScheduler)==null||t.stop(),(e=this.indexBackfillerScheduler)==null||e.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}}sr.provider={build:()=>new sr};class Lf extends sr{constructor(t){super(),this.cacheSizeBytes=t}Fu(t,e){W(this.persistence.referenceDelegate instanceof rr,46915);const r=this.persistence.referenceDelegate.garbageCollector;return new Vd(r,t.asyncQueue,e)}Cu(t){const e=this.cacheSizeBytes!==void 0?It.withCacheSize(this.cacheSizeBytes):It.DEFAULT;return new ou(r=>rr.mi(r,e),this.serializer)}}class vs{async initialize(t,e){this.localStore||(this.localStore=t.localStore,this.sharedClientState=t.sharedClientState,this.datastore=this.createDatastore(e),this.remoteStore=this.createRemoteStore(e),this.eventManager=this.createEventManager(e),this.syncEngine=this.createSyncEngine(e,!t.synchronizeTabs),this.sharedClientState.onlineStateHandler=r=>Jo(this.syncEngine,r,1),this.remoteStore.remoteSyncer.handleCredentialChange=Of.bind(null,this.syncEngine),await pf(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(t){return function(){return new yf}()}createDatastore(t){const e=cu(t.databaseInfo.databaseId),r=function(o){return new sf(o)}(t.databaseInfo);return function(o,u,l,d){return new cf(o,u,l,d)}(t.authCredentials,t.appCheckCredentials,r,e)}createRemoteStore(t){return function(r,i,o,u,l){return new hf(r,i,o,u,l)}(this.localStore,this.datastore,t.asyncQueue,e=>Jo(this.syncEngine,e,0),function(){return Ho.v()?new Ho:new tf}())}createSyncEngine(t,e){return function(i,o,u,l,d,f,_){const w=new Sf(i,o,u,l,d,f);return _&&(w.gu=!0),w}(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,t.initialUser,t.maxConcurrentLimboResolutions,e)}async terminate(){var t,e;await async function(i){const o=q(i);V(De,"RemoteStore shutting down."),o.Ea.add(5),await In(o),o.Aa.shutdown(),o.Ra.set("Unknown")}(this.remoteStore),(t=this.datastore)==null||t.terminate(),(e=this.eventManager)==null||e.terminate()}}vs.provider={build:()=>new vs};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ff{constructor(t){this.observer=t,this.muted=!1}next(t){this.muted||this.observer.next&&this.Ou(this.observer.next,t)}error(t){this.muted||(this.observer.error?this.Ou(this.observer.error,t):Ot("Uncaught Error in snapshot listener:",t.toString()))}Nu(){this.muted=!0}Ou(t,e){setTimeout(()=>{this.muted||t(e)},0)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const te="FirestoreClient";class Uf{constructor(t,e,r,i,o){this.authCredentials=t,this.appCheckCredentials=e,this.asyncQueue=r,this.databaseInfo=i,this.user=mt.UNAUTHENTICATED,this.clientId=Ss.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=o,this.authCredentials.start(r,async u=>{V(te,"Received user=",u.uid),await this.authCredentialListener(u),this.user=u}),this.appCheckCredentials.start(r,u=>(V(te,"Received new app check token=",u),this.appCheckCredentialListener(u,this.user)))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this.databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(t){this.authCredentialListener=t}setAppCheckTokenChangeListener(t){this.appCheckCredentialListener=t}terminate(){this.asyncQueue.enterRestrictedMode();const t=new ce;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted(async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),t.resolve()}catch(e){const r=mu(e,"Failed to shutdown persistence");t.reject(r)}}),t.promise}}async function Wr(n,t){n.asyncQueue.verifyOperationInProgress(),V(te,"Initializing OfflineComponentProvider");const e=n.configuration;await t.initialize(e);let r=e.initialUser;n.setCredentialChangeListener(async i=>{r.isEqual(i)||(await au(t.localStore,i),r=i)}),t.persistence.setDatabaseDeletedListener(()=>n.terminate()),n._offlineComponents=t}async function ta(n,t){n.asyncQueue.verifyOperationInProgress();const e=await Bf(n);V(te,"Initializing OnlineComponentProvider"),await t.initialize(e,n.configuration),n.setCredentialChangeListener(r=>Qo(t.remoteStore,r)),n.setAppCheckTokenChangeListener((r,i)=>Qo(t.remoteStore,i)),n._onlineComponents=t}async function Bf(n){if(!n._offlineComponents)if(n._uninitializedComponentsProvider){V(te,"Using user provided OfflineComponentProvider");try{await Wr(n,n._uninitializedComponentsProvider._offline)}catch(t){const e=t;if(!function(i){return i.name==="FirebaseError"?i.code===P.FAILED_PRECONDITION||i.code===P.UNIMPLEMENTED:!(typeof DOMException<"u"&&i instanceof DOMException)||i.code===22||i.code===20||i.code===11}(e))throw e;Ce("Error using user provided cache. Falling back to memory cache: "+e),await Wr(n,new sr)}}else V(te,"Using default OfflineComponentProvider"),await Wr(n,new Lf(void 0));return n._offlineComponents}async function jf(n){return n._onlineComponents||(n._uninitializedComponentsProvider?(V(te,"Using user provided OnlineComponentProvider"),await ta(n,n._uninitializedComponentsProvider._online)):(V(te,"Using default OnlineComponentProvider"),await ta(n,new vs))),n._onlineComponents}async function qf(n){const t=await jf(n),e=t.eventManager;return e.onListen=Pf.bind(null,t.syncEngine),e.onUnlisten=Df.bind(null,t.syncEngine),e.onFirstRemoteStoreListen=bf.bind(null,t.syncEngine),e.onLastRemoteStoreUnlisten=Nf.bind(null,t.syncEngine),e}function $f(n,t,e={}){const r=new ce;return n.asyncQueue.enqueueAndForget(async()=>function(o,u,l,d,f){const _=new Ff({next:R=>{_.Nu(),u.enqueueAndForget(()=>Tf(o,w));const S=R.docs.has(l);!S&&R.fromCache?f.reject(new N(P.UNAVAILABLE,"Failed to get document because the client is offline.")):S&&R.fromCache&&d&&d.source==="server"?f.reject(new N(P.UNAVAILABLE,'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')):f.resolve(R)},error:R=>f.reject(R)}),w=new wf(Ns(l.path),_,{includeMetadataChanges:!0,qa:!0});return Ef(o,w)}(await qf(n),n.asyncQueue,t,e,r)),r.promise}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function vu(n){const t={};return n.timeoutSeconds!==void 0&&(t.timeoutSeconds=n.timeoutSeconds),t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ea=new Map;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const wu="firestore.googleapis.com",na=!0;class ra{constructor(t){if(t.host===void 0){if(t.ssl!==void 0)throw new N(P.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=wu,this.ssl=na}else this.host=t.host,this.ssl=t.ssl??na;if(this.isUsingEmulator=t.emulatorOptions!==void 0,this.credentials=t.credentials,this.ignoreUndefinedProperties=!!t.ignoreUndefinedProperties,this.localCache=t.localCache,t.cacheSizeBytes===void 0)this.cacheSizeBytes=iu;else{if(t.cacheSizeBytes!==-1&&t.cacheSizeBytes<Pd)throw new N(P.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=t.cacheSizeBytes}uh("experimentalForceLongPolling",t.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",t.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!t.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:t.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!t.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=vu(t.experimentalLongPollingOptions??{}),function(r){if(r.timeoutSeconds!==void 0){if(isNaN(r.timeoutSeconds))throw new N(P.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (must not be NaN)`);if(r.timeoutSeconds<5)throw new N(P.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (minimum allowed value is 5)`);if(r.timeoutSeconds>30)throw new N(P.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (maximum allowed value is 30)`)}}(this.experimentalLongPollingOptions),this.useFetchStreams=!!t.useFetchStreams}isEqual(t){return this.host===t.host&&this.ssl===t.ssl&&this.credentials===t.credentials&&this.cacheSizeBytes===t.cacheSizeBytes&&this.experimentalForceLongPolling===t.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===t.experimentalAutoDetectLongPolling&&function(r,i){return r.timeoutSeconds===i.timeoutSeconds}(this.experimentalLongPollingOptions,t.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===t.ignoreUndefinedProperties&&this.useFetchStreams===t.useFetchStreams}}class Qs{constructor(t,e,r,i){this._authCredentials=t,this._appCheckCredentials=e,this._databaseId=r,this._app=i,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new ra({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new N(P.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(t){if(this._settingsFrozen)throw new N(P.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new ra(t),this._emulatorOptions=t.emulatorOptions||{},t.credentials!==void 0&&(this._authCredentials=function(r){if(!r)return new Yl;switch(r.type){case"firstParty":return new eh(r.sessionIndex||"0",r.iamToken||null,r.authTokenFactory||null);case"provider":return r.client;default:throw new N(P.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}}(t.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return function(e){const r=ea.get(e);r&&(V("ComponentProvider","Removing Datastore"),ea.delete(e),r.terminate())}(this),Promise.resolve()}}function zf(n,t,e,r={}){var f;n=os(n,Qs);const i=As(t),o=n._getSettings(),u={...o,emulatorOptions:n._getEmulatorOptions()},l=`${t}:${e}`;i&&(wc(`https://${l}`),Sc("Firestore",!0)),o.host!==wu&&o.host!==l&&Ce("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");const d={...o,host:l,ssl:i,emulatorOptions:r};if(!Xn(d,u)&&(n._setSettings(d),r.mockUserToken)){let _,w;if(typeof r.mockUserToken=="string")_=r.mockUserToken,w=mt.MOCK_USER;else{_=Ac(r.mockUserToken,(f=n._app)==null?void 0:f.options.projectId);const R=r.mockUserToken.sub||r.mockUserToken.user_id;if(!R)throw new N(P.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");w=new mt(R)}n._authCredentials=new Jl(new Pa(_,w))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ws{constructor(t,e,r){this.converter=e,this._query=r,this.type="query",this.firestore=t}withConverter(t){return new Ws(this.firestore,t,this._query)}}class Et{constructor(t,e,r){this.converter=e,this._key=r,this.type="document",this.firestore=t}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new _n(this.firestore,this.converter,this._key.path.popLast())}withConverter(t){return new Et(this.firestore,t,this._key)}toJSON(){return{type:Et._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(t,e,r){if(yn(e,Et._jsonSchema))return new Et(t,r||null,new k(Q.fromString(e.referencePath)))}}Et._jsonSchemaVersion="firestore/documentReference/1.0",Et._jsonSchema={type:nt("string",Et._jsonSchemaVersion),referencePath:nt("string")};class _n extends Ws{constructor(t,e,r){super(t,e,Ns(r)),this._path=r,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const t=this._path.popLast();return t.isEmpty()?null:new Et(this.firestore,null,new k(t))}withConverter(t){return new _n(this.firestore,t,this._path)}}function sa(n,t,...e){if(n=Mc(n),arguments.length===1&&(t=Ss.newId()),ah("doc","path",t),n instanceof Qs){const r=Q.fromString(t,...e);return po(r),new Et(n,null,new k(r))}{if(!(n instanceof Et||n instanceof _n))throw new N(P.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=n._path.child(Q.fromString(t,...e));return po(r),new Et(n.firestore,n instanceof _n?n.converter:null,new k(r))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ia="AsyncQueue";class oa{constructor(t=Promise.resolve()){this.Xu=[],this.ec=!1,this.tc=[],this.nc=null,this.rc=!1,this.sc=!1,this.oc=[],this.M_=new lu(this,"async_queue_retry"),this._c=()=>{const r=Qr();r&&V(ia,"Visibility state changed to "+r.visibilityState),this.M_.w_()},this.ac=t;const e=Qr();e&&typeof e.addEventListener=="function"&&e.addEventListener("visibilitychange",this._c)}get isShuttingDown(){return this.ec}enqueueAndForget(t){this.enqueue(t)}enqueueAndForgetEvenWhileRestricted(t){this.uc(),this.cc(t)}enterRestrictedMode(t){if(!this.ec){this.ec=!0,this.sc=t||!1;const e=Qr();e&&typeof e.removeEventListener=="function"&&e.removeEventListener("visibilitychange",this._c)}}enqueue(t){if(this.uc(),this.ec)return new Promise(()=>{});const e=new ce;return this.cc(()=>this.ec&&this.sc?Promise.resolve():(t().then(e.resolve,e.reject),e.promise)).then(()=>e.promise)}enqueueRetryable(t){this.enqueueAndForget(()=>(this.Xu.push(t),this.lc()))}async lc(){if(this.Xu.length!==0){try{await this.Xu[0](),this.Xu.shift(),this.M_.reset()}catch(t){if(!Oe(t))throw t;V(ia,"Operation failed with retryable error: "+t)}this.Xu.length>0&&this.M_.p_(()=>this.lc())}}cc(t){const e=this.ac.then(()=>(this.rc=!0,t().catch(r=>{throw this.nc=r,this.rc=!1,Ot("INTERNAL UNHANDLED ERROR: ",aa(r)),r}).then(r=>(this.rc=!1,r))));return this.ac=e,e}enqueueAfterDelay(t,e,r){this.uc(),this.oc.indexOf(t)>-1&&(e=0);const i=zs.createAndSchedule(this,t,e,r,o=>this.hc(o));return this.tc.push(i),i}uc(){this.nc&&L(47125,{Pc:aa(this.nc)})}verifyOperationInProgress(){}async Tc(){let t;do t=this.ac,await t;while(t!==this.ac)}Ic(t){for(const e of this.tc)if(e.timerId===t)return!0;return!1}Ec(t){return this.Tc().then(()=>{this.tc.sort((e,r)=>e.targetTimeMs-r.targetTimeMs);for(const e of this.tc)if(e.skipDelay(),t!=="all"&&e.timerId===t)break;return this.Tc()})}dc(t){this.oc.push(t)}hc(t){const e=this.tc.indexOf(t);this.tc.splice(e,1)}}function aa(n){let t=n.message||"";return n.stack&&(t=n.stack.includes(n.message)?n.stack:n.message+`
`+n.stack),t}class Au extends Qs{constructor(t,e,r,i){super(t,e,r,i),this.type="firestore",this._queue=new oa,this._persistenceKey=(i==null?void 0:i.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const t=this._firestoreClient.terminate();this._queue=new oa(t),this._firestoreClient=void 0,await t}}}function Hf(n,t){const e=typeof n=="object"?n:Fl(),r=typeof n=="string"?n:Jn,i=kl(e,"firestore").getImmediate({identifier:r});if(!i._initialized){const o=Ic("firestore");o&&zf(i,...o)}return i}function Gf(n){if(n._terminated)throw new N(P.FAILED_PRECONDITION,"The client has already been terminated.");return n._firestoreClient||Kf(n),n._firestoreClient}function Kf(n){var r,i,o;const t=n._freezeSettings(),e=function(l,d,f,_){return new vh(l,d,f,_.host,_.ssl,_.experimentalForceLongPolling,_.experimentalAutoDetectLongPolling,vu(_.experimentalLongPollingOptions),_.useFetchStreams,_.isUsingEmulator)}(n._databaseId,((r=n._app)==null?void 0:r.options.appId)||"",n._persistenceKey,t);n._componentsProvider||(i=t.localCache)!=null&&i._offlineComponentProvider&&((o=t.localCache)!=null&&o._onlineComponentProvider)&&(n._componentsProvider={_offline:t.localCache._offlineComponentProvider,_online:t.localCache._onlineComponentProvider}),n._firestoreClient=new Uf(n._authCredentials,n._appCheckCredentials,n._queue,e,n._componentsProvider&&function(l){const d=l==null?void 0:l._online.build();return{_offline:l==null?void 0:l._offline.build(d),_online:d}}(n._componentsProvider))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bt{constructor(t){this._byteString=t}static fromBase64String(t){try{return new bt(ht.fromBase64String(t))}catch(e){throw new N(P.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+e)}}static fromUint8Array(t){return new bt(ht.fromUint8Array(t))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(t){return this._byteString.isEqual(t._byteString)}toJSON(){return{type:bt._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(t){if(yn(t,bt._jsonSchema))return bt.fromBase64String(t.bytes)}}bt._jsonSchemaVersion="firestore/bytes/1.0",bt._jsonSchema={type:nt("string",bt._jsonSchemaVersion),bytes:nt("string")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ru{constructor(...t){for(let e=0;e<t.length;++e)if(t[e].length===0)throw new N(P.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new yt(t)}isEqual(t){return this._internalPath.isEqual(t._internalPath)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Kt{constructor(t,e){if(!isFinite(t)||t<-90||t>90)throw new N(P.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+t);if(!isFinite(e)||e<-180||e>180)throw new N(P.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+e);this._lat=t,this._long=e}get latitude(){return this._lat}get longitude(){return this._long}isEqual(t){return this._lat===t._lat&&this._long===t._long}_compareTo(t){return U(this._lat,t._lat)||U(this._long,t._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:Kt._jsonSchemaVersion}}static fromJSON(t){if(yn(t,Kt._jsonSchema))return new Kt(t.latitude,t.longitude)}}Kt._jsonSchemaVersion="firestore/geoPoint/1.0",Kt._jsonSchema={type:nt("string",Kt._jsonSchemaVersion),latitude:nt("number"),longitude:nt("number")};/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qt{constructor(t){this._values=(t||[]).map(e=>e)}toArray(){return this._values.map(t=>t)}isEqual(t){return function(r,i){if(r.length!==i.length)return!1;for(let o=0;o<r.length;++o)if(r[o]!==i[o])return!1;return!0}(this._values,t._values)}toJSON(){return{type:Qt._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(t){if(yn(t,Qt._jsonSchema)){if(Array.isArray(t.vectorValues)&&t.vectorValues.every(e=>typeof e=="number"))return new Qt(t.vectorValues);throw new N(P.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}Qt._jsonSchemaVersion="firestore/vectorValue/1.0",Qt._jsonSchema={type:nt("string",Qt._jsonSchemaVersion),vectorValues:nt("object")};const Qf=new RegExp("[~\\*/\\[\\]]");function Wf(n,t,e){if(t.search(Qf)>=0)throw ua(`Invalid field path (${t}). Paths must not contain '~', '*', '/', '[', or ']'`,n);try{return new Ru(...t.split("."))._internalPath}catch{throw ua(`Invalid field path (${t}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,n)}}function ua(n,t,e,r,i){let o=`Function ${t}() called with invalid data`;o+=". ";let u="";return new N(P.INVALID_ARGUMENT,o+n+u)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Cu{constructor(t,e,r,i,o){this._firestore=t,this._userDataWriter=e,this._key=r,this._document=i,this._converter=o}get id(){return this._key.path.lastSegment()}get ref(){return new Et(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const t=new Xf(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(t)}return this._userDataWriter.convertValue(this._document.data.value)}}get(t){if(this._document){const e=this._document.data.field(Su("DocumentSnapshot.get",t));if(e!==null)return this._userDataWriter.convertValue(e)}}}class Xf extends Cu{data(){return super.data()}}function Su(n,t){return typeof t=="string"?Wf(n,t):t instanceof Ru?t._internalPath:t._delegate._internalPath}class Yf{convertValue(t,e="none"){switch(Jt(t)){case 0:return null;case 1:return t.booleanValue;case 2:return J(t.integerValue||t.doubleValue);case 3:return this.convertTimestamp(t.timestampValue);case 4:return this.convertServerTimestamp(t,e);case 5:return t.stringValue;case 6:return this.convertBytes(Yt(t.bytesValue));case 7:return this.convertReference(t.referenceValue);case 8:return this.convertGeoPoint(t.geoPointValue);case 9:return this.convertArray(t.arrayValue,e);case 11:return this.convertObject(t.mapValue,e);case 10:return this.convertVectorValue(t.mapValue);default:throw L(62114,{value:t})}}convertObject(t,e){return this.convertObjectMap(t.fields,e)}convertObjectMap(t,e="none"){const r={};return En(t,(i,o)=>{r[i]=this.convertValue(o,e)}),r}convertVectorValue(t){var r,i,o;const e=(o=(i=(r=t.fields)==null?void 0:r[us].arrayValue)==null?void 0:i.values)==null?void 0:o.map(u=>J(u.doubleValue));return new Qt(e)}convertGeoPoint(t){return new Kt(J(t.latitude),J(t.longitude))}convertArray(t,e){return(t.values||[]).map(r=>this.convertValue(r,e))}convertServerTimestamp(t,e){switch(e){case"previous":const r=ur(t);return r==null?null:this.convertValue(r,e);case"estimate":return this.convertTimestamp(mn(t));default:return null}}convertTimestamp(t){const e=Xt(t);return new et(e.seconds,e.nanos)}convertDocumentKey(t,e){const r=Q.fromString(t);W(su(r),9688,{name:t});const i=new gn(r.get(1),r.get(3)),o=new k(r.popFirst(5));return i.isEqual(e)||Ot(`Document ${o} contains a document reference within a different database (${i.projectId}/${i.database}) which is not supported. It will be treated as a reference in the current database (${e.projectId}/${e.database}) instead.`),o}}class nn{constructor(t,e){this.hasPendingWrites=t,this.fromCache=e}isEqual(t){return this.hasPendingWrites===t.hasPendingWrites&&this.fromCache===t.fromCache}}class he extends Cu{constructor(t,e,r,i,o,u){super(t,e,r,i,u),this._firestore=t,this._firestoreImpl=t,this.metadata=o}exists(){return super.exists()}data(t={}){if(this._document){if(this._converter){const e=new Qn(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(e,t)}return this._userDataWriter.convertValue(this._document.data.value,t.serverTimestamps)}}get(t,e={}){if(this._document){const r=this._document.data.field(Su("DocumentSnapshot.get",t));if(r!==null)return this._userDataWriter.convertValue(r,e.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new N(P.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const t=this._document,e={};return e.type=he._jsonSchemaVersion,e.bundle="",e.bundleSource="DocumentSnapshot",e.bundleName=this._key.toString(),!t||!t.isValidDocument()||!t.isFoundDocument()?e:(this._userDataWriter.convertObjectMap(t.data.value.mapValue.fields,"previous"),e.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),e)}}he._jsonSchemaVersion="firestore/documentSnapshot/1.0",he._jsonSchema={type:nt("string",he._jsonSchemaVersion),bundleSource:nt("string","DocumentSnapshot"),bundleName:nt("string"),bundle:nt("string")};class Qn extends he{data(t={}){return super.data(t)}}class cn{constructor(t,e,r,i){this._firestore=t,this._userDataWriter=e,this._snapshot=i,this.metadata=new nn(i.hasPendingWrites,i.fromCache),this.query=r}get docs(){const t=[];return this.forEach(e=>t.push(e)),t}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(t,e){this._snapshot.docs.forEach(r=>{t.call(e,new Qn(this._firestore,this._userDataWriter,r.key,r,new nn(this._snapshot.mutatedKeys.has(r.key),this._snapshot.fromCache),this.query.converter))})}docChanges(t={}){const e=!!t.includeMetadataChanges;if(e&&this._snapshot.excludesMetadataChanges)throw new N(P.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===e||(this._cachedChanges=function(i,o){if(i._snapshot.oldDocs.isEmpty()){let u=0;return i._snapshot.docChanges.map(l=>{const d=new Qn(i._firestore,i._userDataWriter,l.doc.key,l.doc,new nn(i._snapshot.mutatedKeys.has(l.doc.key),i._snapshot.fromCache),i.query.converter);return l.doc,{type:"added",doc:d,oldIndex:-1,newIndex:u++}})}{let u=i._snapshot.oldDocs;return i._snapshot.docChanges.filter(l=>o||l.type!==3).map(l=>{const d=new Qn(i._firestore,i._userDataWriter,l.doc.key,l.doc,new nn(i._snapshot.mutatedKeys.has(l.doc.key),i._snapshot.fromCache),i.query.converter);let f=-1,_=-1;return l.type!==0&&(f=u.indexOf(l.doc.key),u=u.delete(l.doc.key)),l.type!==1&&(u=u.add(l.doc),_=u.indexOf(l.doc.key)),{type:Jf(l.type),doc:d,oldIndex:f,newIndex:_}})}}(this,e),this._cachedChangesIncludeMetadataChanges=e),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new N(P.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const t={};t.type=cn._jsonSchemaVersion,t.bundleSource="QuerySnapshot",t.bundleName=Ss.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const e=[],r=[],i=[];return this.docs.forEach(o=>{o._document!==null&&(e.push(o._document),r.push(this._userDataWriter.convertObjectMap(o._document.data.value.mapValue.fields,"previous")),i.push(o.ref.path))}),t.bundle=(this._firestore,this.query._query,t.bundleName,"NOT SUPPORTED"),t}}function Jf(n){switch(n){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return L(61501,{type:n})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ca(n){n=os(n,Et);const t=os(n.firestore,Au);return $f(Gf(t),n._key).then(e=>tm(t,n,e))}cn._jsonSchemaVersion="firestore/querySnapshot/1.0",cn._jsonSchema={type:nt("string",cn._jsonSchemaVersion),bundleSource:nt("string","QuerySnapshot"),bundleName:nt("string"),bundle:nt("string")};class Zf extends Yf{constructor(t){super(),this.firestore=t}convertBytes(t){return new bt(t)}convertReference(t){const e=this.convertDocumentKey(t,this.firestore._databaseId);return new Et(this.firestore,null,e)}}function tm(n,t,e){const r=e.docs.get(t._key),i=new Zf(n);return new he(n,i,t._key,r,new nn(e.hasPendingWrites,e.fromCache),t.converter)}(function(t,e=!0){(function(i){xe=i})(Ll),Yn(new ln("firestore",(r,{instanceIdentifier:i,options:o})=>{const u=r.getProvider("app").getImmediate(),l=new Au(new Zl(r.getProvider("auth-internal")),new nh(u,r.getProvider("app-check-internal")),function(f,_){if(!Object.prototype.hasOwnProperty.apply(f.options,["projectId"]))throw new N(P.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new gn(f.options.projectId,_)}(u,i),u);return o={useFetchStreams:e,...o},l._setSettings(o),l},"PUBLIC").setMultipleInstances(!0)),we(ho,fo,t),we(ho,fo,"esm2020")})();const em={apiKey:"AIzaSyANSk1PwPkMabX6kRGOYnldoeEC8VvtB5Q",authDomain:"ai-resume-f9b01.firebaseapp.com",projectId:"ai-resume-f9b01",storageBucket:"ai-resume-f9b01.firebasestorage.app",messagingSenderId:"836466410766",appId:"1:836466410766:web:146188f9d00106ea1d835f"},nm=oo().length===0?ya(em):oo()[0],la=Hf(nm),$n="https://ai-resume-git-feature-9d1c2b-gopalakrishnachennu-5461s-projects.vercel.app",Pu=document.getElementById("not-connected"),bu=document.getElementById("connected"),Xr=document.getElementById("connect-btn"),At=document.getElementById("fill-btn"),ye=document.getElementById("refresh-btn"),Yr=document.getElementById("settings-btn"),Jr=document.getElementById("dashboard-btn"),rm=document.getElementById("user-name"),sm=document.getElementById("user-email"),im=document.getElementById("user-avatar"),om=document.getElementById("avatar-letter"),Vu=document.getElementById("stat-filled");document.getElementById("stat-accuracy");const Du=document.getElementById("stat-apps");let kt=null,de=null;async function am(){var t;console.log("[Popup] Initializing with Firebase sync...");const n=await chrome.storage.local.get(["auth","stats"]);(t=n.auth)!=null&&t.uid?(de=n.auth.uid,console.log("[Popup] Found userId:",de),await Xs(de),Nu(n.auth,kt,n.stats)):(console.log("[Popup] No userId in storage - showing not connected"),um()),cm()}async function Xs(n){try{console.log("[Popup] Loading session from Firebase for:",n);const t=await ca(sa(la,"activeSession",n));if(t.exists())kt=t.data(),console.log("[Popup] ✅ Session loaded from Firebase:",{jobTitle:kt.jobTitle,jobCompany:kt.jobCompany,hasPersonalInfo:!!kt.personalInfo,hasSkills:!!kt.skills}),await chrome.storage.local.set({session:kt,profile:kt});else{console.log("[Popup] No active session in Firebase for user:",n);const e=await ca(sa(la,"users",n,"settings","extension"));if(e.exists()){const r=e.data();console.log("[Popup] Loaded extension settings as fallback"),await chrome.storage.local.set({extensionSettings:r})}}}catch(t){console.error("[Popup] Firebase load failed:",t)}}function Nu(n,t,e){var o,u;Pu.style.display="none",bu.style.display="flex";const r=n.displayName||((o=t==null?void 0:t.personalInfo)==null?void 0:o.name)||"User",i=n.email||((u=t==null?void 0:t.personalInfo)==null?void 0:u.email)||"";if(rm.textContent=r,sm.textContent=i,n.photoURL?im.innerHTML=`<img src="${n.photoURL}" alt="${r}">`:om.textContent=r[0].toUpperCase(),e&&(Vu.textContent=e.filledToday||0,Du.textContent=e.totalFilled||0),t!=null&&t.jobTitle){const l=At.querySelector(".btn-subtitle");l&&(l.textContent=`${t.jobTitle} @ ${t.jobCompany}`)}}function um(){Pu.style.display="flex",bu.style.display="none"}function cm(){Xr==null||Xr.addEventListener("click",()=>{chrome.tabs.create({url:$n+"/settings/extension"})}),At==null||At.addEventListener("click",lm),ye==null||ye.addEventListener("click",async()=>{if(de){const n=ye.textContent;ye.textContent="...",await Xs(de),ye.textContent=n;const t=await chrome.storage.local.get(["auth","stats"]);Nu(t.auth,kt,t.stats)}else chrome.tabs.create({url:$n+"/settings/extension"})}),Yr==null||Yr.addEventListener("click",()=>{chrome.tabs.create({url:$n+"/settings/extension"})}),Jr==null||Jr.addEventListener("click",()=>{chrome.tabs.create({url:$n+"/dashboard"})})}async function lm(){const n=At.querySelector(".btn-title"),t=At.querySelector(".btn-icon"),e=n.textContent,r=t.textContent;At.classList.add("loading"),n.textContent="Filling...",t.textContent="↻";try{de&&await Xs(de);const o=await chrome.storage.local.get(["profile","session"]);if(console.log("[Popup] Fill with data:",o),!o.profile&&!o.session){i(),n.textContent="No session - Flash first!",setTimeout(()=>{n.textContent=e},2e3);return}const[u]=await chrome.tabs.query({active:!0,currentWindow:!0});if(!(u!=null&&u.id)){i(),n.textContent="No active tab",setTimeout(()=>{n.textContent=e},2e3);return}chrome.tabs.sendMessage(u.id,{type:"FILL_FORM"},l=>{if(At.classList.remove("loading"),chrome.runtime.lastError){n.textContent="Navigate to job page first",t.textContent="📋",setTimeout(()=>{n.textContent=e,t.textContent=r},2e3);return}l!=null&&l.success?(At.classList.add("success"),n.textContent="Filled "+(l.filled||0)+" Fields!",t.textContent="✓",hm(l.filled||0),setTimeout(()=>{At.classList.remove("success"),n.textContent=e,t.textContent=r},3e3)):(n.textContent=(l==null?void 0:l.error)||"No forms found",t.textContent="⚠",setTimeout(()=>{n.textContent=e,t.textContent=r},2500))})}catch(o){console.error("[Popup] Fill error:",o),i()}function i(){At.classList.remove("loading"),n.textContent=e,t.textContent=r}}async function hm(n){try{const e=(await chrome.storage.local.get(["stats"])).stats||{filledToday:0,totalFilled:0};e.filledToday=(e.filledToday||0)+n,e.totalFilled=(e.totalFilled||0)+n,await chrome.storage.local.set({stats:e}),Vu.textContent=e.filledToday,Du.textContent=e.totalFilled}catch(t){console.error("[Popup] Update stats failed:",t)}}document.addEventListener("DOMContentLoaded",am);
