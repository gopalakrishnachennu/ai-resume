(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const c of o.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&n(c)}).observe(document,{childList:!0,subtree:!0});function e(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function n(i){if(i.ep)return;i.ep=!0;const o=e(i);fetch(i.href,o)}})();const lu=()=>{};var no={};/**
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
 */const da=function(r){const t=[];let e=0;for(let n=0;n<r.length;n++){let i=r.charCodeAt(n);i<128?t[e++]=i:i<2048?(t[e++]=i>>6|192,t[e++]=i&63|128):(i&64512)===55296&&n+1<r.length&&(r.charCodeAt(n+1)&64512)===56320?(i=65536+((i&1023)<<10)+(r.charCodeAt(++n)&1023),t[e++]=i>>18|240,t[e++]=i>>12&63|128,t[e++]=i>>6&63|128,t[e++]=i&63|128):(t[e++]=i>>12|224,t[e++]=i>>6&63|128,t[e++]=i&63|128)}return t},hu=function(r){const t=[];let e=0,n=0;for(;e<r.length;){const i=r[e++];if(i<128)t[n++]=String.fromCharCode(i);else if(i>191&&i<224){const o=r[e++];t[n++]=String.fromCharCode((i&31)<<6|o&63)}else if(i>239&&i<365){const o=r[e++],c=r[e++],l=r[e++],d=((i&7)<<18|(o&63)<<12|(c&63)<<6|l&63)-65536;t[n++]=String.fromCharCode(55296+(d>>10)),t[n++]=String.fromCharCode(56320+(d&1023))}else{const o=r[e++],c=r[e++];t[n++]=String.fromCharCode((i&15)<<12|(o&63)<<6|c&63)}}return t.join("")},fa={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(r,t){if(!Array.isArray(r))throw Error("encodeByteArray takes an array as a parameter");this.init_();const e=t?this.byteToCharMapWebSafe_:this.byteToCharMap_,n=[];for(let i=0;i<r.length;i+=3){const o=r[i],c=i+1<r.length,l=c?r[i+1]:0,d=i+2<r.length,f=d?r[i+2]:0,_=o>>2,v=(o&3)<<4|l>>4;let R=(l&15)<<2|f>>6,S=f&63;d||(S=64,c||(R=64)),n.push(e[_],e[v],e[R],e[S])}return n.join("")},encodeString(r,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(r):this.encodeByteArray(da(r),t)},decodeString(r,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(r):hu(this.decodeStringToByteArray(r,t))},decodeStringToByteArray(r,t){this.init_();const e=t?this.charToByteMapWebSafe_:this.charToByteMap_,n=[];for(let i=0;i<r.length;){const o=e[r.charAt(i++)],l=i<r.length?e[r.charAt(i)]:0;++i;const f=i<r.length?e[r.charAt(i)]:64;++i;const v=i<r.length?e[r.charAt(i)]:64;if(++i,o==null||l==null||f==null||v==null)throw new du;const R=o<<2|l>>4;if(n.push(R),f!==64){const S=l<<4&240|f>>2;if(n.push(S),v!==64){const N=f<<6&192|v;n.push(N)}}}return n},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let r=0;r<this.ENCODED_VALS.length;r++)this.byteToCharMap_[r]=this.ENCODED_VALS.charAt(r),this.charToByteMap_[this.byteToCharMap_[r]]=r,this.byteToCharMapWebSafe_[r]=this.ENCODED_VALS_WEBSAFE.charAt(r),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[r]]=r,r>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(r)]=r,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(r)]=r)}}};class du extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const fu=function(r){const t=da(r);return fa.encodeByteArray(t,!0)},Xn=function(r){return fu(r).replace(/\./g,"")},mu=function(r){try{return fa.decodeString(r,!0)}catch(t){console.error("base64Decode failed: ",t)}return null};/**
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
 */function gu(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
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
 */const pu=()=>gu().__FIREBASE_DEFAULTS__,_u=()=>{if(typeof process>"u"||typeof no>"u")return;const r=no.__FIREBASE_DEFAULTS__;if(r)return JSON.parse(r)},yu=()=>{if(typeof document>"u")return;let r;try{r=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const t=r&&mu(r[1]);return t&&JSON.parse(t)},Ss=()=>{try{return lu()||pu()||_u()||yu()}catch(r){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${r}`);return}},Eu=r=>{var t,e;return(e=(t=Ss())==null?void 0:t.emulatorHosts)==null?void 0:e[r]},Tu=r=>{const t=Eu(r);if(!t)return;const e=t.lastIndexOf(":");if(e<=0||e+1===t.length)throw new Error(`Invalid host ${t} with no separate hostname and port!`);const n=parseInt(t.substring(e+1),10);return t[0]==="["?[t.substring(1,e-1),n]:[t.substring(0,e),n]},ma=()=>{var r;return(r=Ss())==null?void 0:r.config};/**
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
 */class vu{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((t,e)=>{this.resolve=t,this.reject=e})}wrapCallback(t){return(e,n)=>{e?this.reject(e):this.resolve(n),typeof t=="function"&&(this.promise.catch(()=>{}),t.length===1?t(e):t(e,n))}}}/**
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
 */function Ps(r){try{return(r.startsWith("http://")||r.startsWith("https://")?new URL(r).hostname:r).endsWith(".cloudworkstations.dev")}catch{return!1}}async function Iu(r){return(await fetch(r,{credentials:"include"})).ok}/**
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
 */function wu(r,t){if(r.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const e={alg:"none",type:"JWT"},n=t||"demo-project",i=r.iat||0,o=r.sub||r.user_id;if(!o)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const c={iss:`https://securetoken.google.com/${n}`,aud:n,iat:i,exp:i+3600,auth_time:i,sub:o,user_id:o,firebase:{sign_in_provider:"custom",identities:{}},...r};return[Xn(JSON.stringify(e)),Xn(JSON.stringify(c)),""].join(".")}const an={};function Au(){const r={prod:[],emulator:[]};for(const t of Object.keys(an))an[t]?r.emulator.push(t):r.prod.push(t);return r}function Ru(r){let t=document.getElementById(r),e=!1;return t||(t=document.createElement("div"),t.setAttribute("id",r),e=!0),{created:e,element:t}}let ro=!1;function Cu(r,t){if(typeof window>"u"||typeof document>"u"||!Ps(window.location.host)||an[r]===t||an[r]||ro)return;an[r]=t;function e(R){return`__firebase__banner__${R}`}const n="__firebase__banner",o=Au().prod.length>0;function c(){const R=document.getElementById(n);R&&R.remove()}function l(R){R.style.display="flex",R.style.background="#7faaf0",R.style.position="fixed",R.style.bottom="5px",R.style.left="5px",R.style.padding=".5em",R.style.borderRadius="5px",R.style.alignItems="center"}function d(R,S){R.setAttribute("width","24"),R.setAttribute("id",S),R.setAttribute("height","24"),R.setAttribute("viewBox","0 0 24 24"),R.setAttribute("fill","none"),R.style.marginLeft="-6px"}function f(){const R=document.createElement("span");return R.style.cursor="pointer",R.style.marginLeft="16px",R.style.fontSize="24px",R.innerHTML=" &times;",R.onclick=()=>{ro=!0,c()},R}function _(R,S){R.setAttribute("id",S),R.innerText="Learn more",R.href="https://firebase.google.com/docs/studio/preview-apps#preview-backend",R.setAttribute("target","__blank"),R.style.paddingLeft="5px",R.style.textDecoration="underline"}function v(){const R=Ru(n),S=e("text"),N=document.getElementById(S)||document.createElement("span"),M=e("learnmore"),D=document.getElementById(M)||document.createElement("a"),Q=e("preprendIcon"),H=document.getElementById(Q)||document.createElementNS("http://www.w3.org/2000/svg","svg");if(R.created){const G=R.element;l(G),_(D,M);const tt=f();d(H,Q),G.append(H,N,D,tt),document.body.appendChild(G)}o?(N.innerText="Preview backend disconnected.",H.innerHTML=`<g clip-path="url(#clip0_6013_33858)">
<path d="M4.8 17.6L12 5.6L19.2 17.6H4.8ZM6.91667 16.4H17.0833L12 7.93333L6.91667 16.4ZM12 15.6C12.1667 15.6 12.3056 15.5444 12.4167 15.4333C12.5389 15.3111 12.6 15.1667 12.6 15C12.6 14.8333 12.5389 14.6944 12.4167 14.5833C12.3056 14.4611 12.1667 14.4 12 14.4C11.8333 14.4 11.6889 14.4611 11.5667 14.5833C11.4556 14.6944 11.4 14.8333 11.4 15C11.4 15.1667 11.4556 15.3111 11.5667 15.4333C11.6889 15.5444 11.8333 15.6 12 15.6ZM11.4 13.6H12.6V10.4H11.4V13.6Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6013_33858">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`):(H.innerHTML=`<g clip-path="url(#clip0_6083_34804)">
<path d="M11.4 15.2H12.6V11.2H11.4V15.2ZM12 10C12.1667 10 12.3056 9.94444 12.4167 9.83333C12.5389 9.71111 12.6 9.56667 12.6 9.4C12.6 9.23333 12.5389 9.09444 12.4167 8.98333C12.3056 8.86111 12.1667 8.8 12 8.8C11.8333 8.8 11.6889 8.86111 11.5667 8.98333C11.4556 9.09444 11.4 9.23333 11.4 9.4C11.4 9.56667 11.4556 9.71111 11.5667 9.83333C11.6889 9.94444 11.8333 10 12 10ZM12 18.4C11.1222 18.4 10.2944 18.2333 9.51667 17.9C8.73889 17.5667 8.05556 17.1111 7.46667 16.5333C6.88889 15.9444 6.43333 15.2611 6.1 14.4833C5.76667 13.7056 5.6 12.8778 5.6 12C5.6 11.1111 5.76667 10.2833 6.1 9.51667C6.43333 8.73889 6.88889 8.06111 7.46667 7.48333C8.05556 6.89444 8.73889 6.43333 9.51667 6.1C10.2944 5.76667 11.1222 5.6 12 5.6C12.8889 5.6 13.7167 5.76667 14.4833 6.1C15.2611 6.43333 15.9389 6.89444 16.5167 7.48333C17.1056 8.06111 17.5667 8.73889 17.9 9.51667C18.2333 10.2833 18.4 11.1111 18.4 12C18.4 12.8778 18.2333 13.7056 17.9 14.4833C17.5667 15.2611 17.1056 15.9444 16.5167 16.5333C15.9389 17.1111 15.2611 17.5667 14.4833 17.9C13.7167 18.2333 12.8889 18.4 12 18.4ZM12 17.2C13.4444 17.2 14.6722 16.6944 15.6833 15.6833C16.6944 14.6722 17.2 13.4444 17.2 12C17.2 10.5556 16.6944 9.32778 15.6833 8.31667C14.6722 7.30555 13.4444 6.8 12 6.8C10.5556 6.8 9.32778 7.30555 8.31667 8.31667C7.30556 9.32778 6.8 10.5556 6.8 12C6.8 13.4444 7.30556 14.6722 8.31667 15.6833C9.32778 16.6944 10.5556 17.2 12 17.2Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6083_34804">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`,N.innerText="Preview backend running in this workspace."),N.setAttribute("id",S)}document.readyState==="loading"?window.addEventListener("DOMContentLoaded",v):v()}/**
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
 */function Su(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function Pu(){var t;const r=(t=Ss())==null?void 0:t.forceEnvironment;if(r==="node")return!0;if(r==="browser")return!1;try{return Object.prototype.toString.call(global.process)==="[object process]"}catch{return!1}}function bu(){return!Pu()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function Vu(){try{return typeof indexedDB=="object"}catch{return!1}}function Du(){return new Promise((r,t)=>{try{let e=!0;const n="validate-browser-context-for-indexeddb-analytics-module",i=self.indexedDB.open(n);i.onsuccess=()=>{i.result.close(),e||self.indexedDB.deleteDatabase(n),r(!0)},i.onupgradeneeded=()=>{e=!1},i.onerror=()=>{var o;t(((o=i.error)==null?void 0:o.message)||"")}}catch(e){t(e)}})}/**
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
 */const Nu="FirebaseError";class Me extends Error{constructor(t,e,n){super(e),this.code=t,this.customData=n,this.name=Nu,Object.setPrototypeOf(this,Me.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,ga.prototype.create)}}class ga{constructor(t,e,n){this.service=t,this.serviceName=e,this.errors=n}create(t,...e){const n=e[0]||{},i=`${this.service}/${t}`,o=this.errors[t],c=o?xu(o,n):"Error",l=`${this.serviceName}: ${c} (${i}).`;return new Me(i,l,n)}}function xu(r,t){return r.replace(ku,(e,n)=>{const i=t[n];return i!=null?String(i):`<${n}?>`})}const ku=/\{\$([^}]+)}/g;function Yn(r,t){if(r===t)return!0;const e=Object.keys(r),n=Object.keys(t);for(const i of e){if(!n.includes(i))return!1;const o=r[i],c=t[i];if(so(o)&&so(c)){if(!Yn(o,c))return!1}else if(o!==c)return!1}for(const i of n)if(!e.includes(i))return!1;return!0}function so(r){return r!==null&&typeof r=="object"}/**
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
 */function Ou(r){return r&&r._delegate?r._delegate:r}class fn{constructor(t,e,n){this.name=t,this.instanceFactory=e,this.type=n,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(t){return this.instantiationMode=t,this}setMultipleInstances(t){return this.multipleInstances=t,this}setServiceProps(t){return this.serviceProps=t,this}setInstanceCreatedCallback(t){return this.onInstanceCreated=t,this}}/**
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
 */const ue="[DEFAULT]";/**
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
 */class Mu{constructor(t,e){this.name=t,this.container=e,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(t){const e=this.normalizeInstanceIdentifier(t);if(!this.instancesDeferred.has(e)){const n=new vu;if(this.instancesDeferred.set(e,n),this.isInitialized(e)||this.shouldAutoInitialize())try{const i=this.getOrInitializeService({instanceIdentifier:e});i&&n.resolve(i)}catch{}}return this.instancesDeferred.get(e).promise}getImmediate(t){const e=this.normalizeInstanceIdentifier(t==null?void 0:t.identifier),n=(t==null?void 0:t.optional)??!1;if(this.isInitialized(e)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:e})}catch(i){if(n)return null;throw i}else{if(n)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(t){if(t.name!==this.name)throw Error(`Mismatching Component ${t.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=t,!!this.shouldAutoInitialize()){if(Fu(t))try{this.getOrInitializeService({instanceIdentifier:ue})}catch{}for(const[e,n]of this.instancesDeferred.entries()){const i=this.normalizeInstanceIdentifier(e);try{const o=this.getOrInitializeService({instanceIdentifier:i});n.resolve(o)}catch{}}}}clearInstance(t=ue){this.instancesDeferred.delete(t),this.instancesOptions.delete(t),this.instances.delete(t)}async delete(){const t=Array.from(this.instances.values());await Promise.all([...t.filter(e=>"INTERNAL"in e).map(e=>e.INTERNAL.delete()),...t.filter(e=>"_delete"in e).map(e=>e._delete())])}isComponentSet(){return this.component!=null}isInitialized(t=ue){return this.instances.has(t)}getOptions(t=ue){return this.instancesOptions.get(t)||{}}initialize(t={}){const{options:e={}}=t,n=this.normalizeInstanceIdentifier(t.instanceIdentifier);if(this.isInitialized(n))throw Error(`${this.name}(${n}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const i=this.getOrInitializeService({instanceIdentifier:n,options:e});for(const[o,c]of this.instancesDeferred.entries()){const l=this.normalizeInstanceIdentifier(o);n===l&&c.resolve(i)}return i}onInit(t,e){const n=this.normalizeInstanceIdentifier(e),i=this.onInitCallbacks.get(n)??new Set;i.add(t),this.onInitCallbacks.set(n,i);const o=this.instances.get(n);return o&&t(o,n),()=>{i.delete(t)}}invokeOnInitCallbacks(t,e){const n=this.onInitCallbacks.get(e);if(n)for(const i of n)try{i(t,e)}catch{}}getOrInitializeService({instanceIdentifier:t,options:e={}}){let n=this.instances.get(t);if(!n&&this.component&&(n=this.component.instanceFactory(this.container,{instanceIdentifier:Lu(t),options:e}),this.instances.set(t,n),this.instancesOptions.set(t,e),this.invokeOnInitCallbacks(n,t),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,t,n)}catch{}return n||null}normalizeInstanceIdentifier(t=ue){return this.component?this.component.multipleInstances?t:ue:t}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function Lu(r){return r===ue?void 0:r}function Fu(r){return r.instantiationMode==="EAGER"}/**
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
 */class Uu{constructor(t){this.name=t,this.providers=new Map}addComponent(t){const e=this.getProvider(t.name);if(e.isComponentSet())throw new Error(`Component ${t.name} has already been registered with ${this.name}`);e.setComponent(t)}addOrOverwriteComponent(t){this.getProvider(t.name).isComponentSet()&&this.providers.delete(t.name),this.addComponent(t)}getProvider(t){if(this.providers.has(t))return this.providers.get(t);const e=new Mu(t,this);return this.providers.set(t,e),e}getProviders(){return Array.from(this.providers.values())}}/**
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
 */var q;(function(r){r[r.DEBUG=0]="DEBUG",r[r.VERBOSE=1]="VERBOSE",r[r.INFO=2]="INFO",r[r.WARN=3]="WARN",r[r.ERROR=4]="ERROR",r[r.SILENT=5]="SILENT"})(q||(q={}));const Bu={debug:q.DEBUG,verbose:q.VERBOSE,info:q.INFO,warn:q.WARN,error:q.ERROR,silent:q.SILENT},ju=q.INFO,qu={[q.DEBUG]:"log",[q.VERBOSE]:"log",[q.INFO]:"info",[q.WARN]:"warn",[q.ERROR]:"error"},$u=(r,t,...e)=>{if(t<r.logLevel)return;const n=new Date().toISOString(),i=qu[t];if(i)console[i](`[${n}]  ${r.name}:`,...e);else throw new Error(`Attempted to log a message with an invalid logType (value: ${t})`)};class pa{constructor(t){this.name=t,this._logLevel=ju,this._logHandler=$u,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(t){if(!(t in q))throw new TypeError(`Invalid value "${t}" assigned to \`logLevel\``);this._logLevel=t}setLogLevel(t){this._logLevel=typeof t=="string"?Bu[t]:t}get logHandler(){return this._logHandler}set logHandler(t){if(typeof t!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=t}get userLogHandler(){return this._userLogHandler}set userLogHandler(t){this._userLogHandler=t}debug(...t){this._userLogHandler&&this._userLogHandler(this,q.DEBUG,...t),this._logHandler(this,q.DEBUG,...t)}log(...t){this._userLogHandler&&this._userLogHandler(this,q.VERBOSE,...t),this._logHandler(this,q.VERBOSE,...t)}info(...t){this._userLogHandler&&this._userLogHandler(this,q.INFO,...t),this._logHandler(this,q.INFO,...t)}warn(...t){this._userLogHandler&&this._userLogHandler(this,q.WARN,...t),this._logHandler(this,q.WARN,...t)}error(...t){this._userLogHandler&&this._userLogHandler(this,q.ERROR,...t),this._logHandler(this,q.ERROR,...t)}}const zu=(r,t)=>t.some(e=>r instanceof e);let io,oo;function Hu(){return io||(io=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function Gu(){return oo||(oo=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const _a=new WeakMap,rs=new WeakMap,ya=new WeakMap,jr=new WeakMap,bs=new WeakMap;function Ku(r){const t=new Promise((e,n)=>{const i=()=>{r.removeEventListener("success",o),r.removeEventListener("error",c)},o=()=>{e(Kt(r.result)),i()},c=()=>{n(r.error),i()};r.addEventListener("success",o),r.addEventListener("error",c)});return t.then(e=>{e instanceof IDBCursor&&_a.set(e,r)}).catch(()=>{}),bs.set(t,r),t}function Qu(r){if(rs.has(r))return;const t=new Promise((e,n)=>{const i=()=>{r.removeEventListener("complete",o),r.removeEventListener("error",c),r.removeEventListener("abort",c)},o=()=>{e(),i()},c=()=>{n(r.error||new DOMException("AbortError","AbortError")),i()};r.addEventListener("complete",o),r.addEventListener("error",c),r.addEventListener("abort",c)});rs.set(r,t)}let ss={get(r,t,e){if(r instanceof IDBTransaction){if(t==="done")return rs.get(r);if(t==="objectStoreNames")return r.objectStoreNames||ya.get(r);if(t==="store")return e.objectStoreNames[1]?void 0:e.objectStore(e.objectStoreNames[0])}return Kt(r[t])},set(r,t,e){return r[t]=e,!0},has(r,t){return r instanceof IDBTransaction&&(t==="done"||t==="store")?!0:t in r}};function Wu(r){ss=r(ss)}function Xu(r){return r===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(t,...e){const n=r.call(qr(this),t,...e);return ya.set(n,t.sort?t.sort():[t]),Kt(n)}:Gu().includes(r)?function(...t){return r.apply(qr(this),t),Kt(_a.get(this))}:function(...t){return Kt(r.apply(qr(this),t))}}function Yu(r){return typeof r=="function"?Xu(r):(r instanceof IDBTransaction&&Qu(r),zu(r,Hu())?new Proxy(r,ss):r)}function Kt(r){if(r instanceof IDBRequest)return Ku(r);if(jr.has(r))return jr.get(r);const t=Yu(r);return t!==r&&(jr.set(r,t),bs.set(t,r)),t}const qr=r=>bs.get(r);function Ju(r,t,{blocked:e,upgrade:n,blocking:i,terminated:o}={}){const c=indexedDB.open(r,t),l=Kt(c);return n&&c.addEventListener("upgradeneeded",d=>{n(Kt(c.result),d.oldVersion,d.newVersion,Kt(c.transaction),d)}),e&&c.addEventListener("blocked",d=>e(d.oldVersion,d.newVersion,d)),l.then(d=>{o&&d.addEventListener("close",()=>o()),i&&d.addEventListener("versionchange",f=>i(f.oldVersion,f.newVersion,f))}).catch(()=>{}),l}const Zu=["get","getKey","getAll","getAllKeys","count"],tl=["put","add","delete","clear"],$r=new Map;function ao(r,t){if(!(r instanceof IDBDatabase&&!(t in r)&&typeof t=="string"))return;if($r.get(t))return $r.get(t);const e=t.replace(/FromIndex$/,""),n=t!==e,i=tl.includes(e);if(!(e in(n?IDBIndex:IDBObjectStore).prototype)||!(i||Zu.includes(e)))return;const o=async function(c,...l){const d=this.transaction(c,i?"readwrite":"readonly");let f=d.store;return n&&(f=f.index(l.shift())),(await Promise.all([f[e](...l),i&&d.done]))[0]};return $r.set(t,o),o}Wu(r=>({...r,get:(t,e,n)=>ao(t,e)||r.get(t,e,n),has:(t,e)=>!!ao(t,e)||r.has(t,e)}));/**
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
 */class el{constructor(t){this.container=t}getPlatformInfoString(){return this.container.getProviders().map(e=>{if(nl(e)){const n=e.getImmediate();return`${n.library}/${n.version}`}else return null}).filter(e=>e).join(" ")}}function nl(r){const t=r.getComponent();return(t==null?void 0:t.type)==="VERSION"}const is="@firebase/app",co="0.14.6";/**
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
 */const Lt=new pa("@firebase/app"),rl="@firebase/app-compat",sl="@firebase/analytics-compat",il="@firebase/analytics",ol="@firebase/app-check-compat",al="@firebase/app-check",cl="@firebase/auth",ul="@firebase/auth-compat",ll="@firebase/database",hl="@firebase/data-connect",dl="@firebase/database-compat",fl="@firebase/functions",ml="@firebase/functions-compat",gl="@firebase/installations",pl="@firebase/installations-compat",_l="@firebase/messaging",yl="@firebase/messaging-compat",El="@firebase/performance",Tl="@firebase/performance-compat",vl="@firebase/remote-config",Il="@firebase/remote-config-compat",wl="@firebase/storage",Al="@firebase/storage-compat",Rl="@firebase/firestore",Cl="@firebase/ai",Sl="@firebase/firestore-compat",Pl="firebase",bl="12.6.0";/**
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
 */const os="[DEFAULT]",Vl={[is]:"fire-core",[rl]:"fire-core-compat",[il]:"fire-analytics",[sl]:"fire-analytics-compat",[al]:"fire-app-check",[ol]:"fire-app-check-compat",[cl]:"fire-auth",[ul]:"fire-auth-compat",[ll]:"fire-rtdb",[hl]:"fire-data-connect",[dl]:"fire-rtdb-compat",[fl]:"fire-fn",[ml]:"fire-fn-compat",[gl]:"fire-iid",[pl]:"fire-iid-compat",[_l]:"fire-fcm",[yl]:"fire-fcm-compat",[El]:"fire-perf",[Tl]:"fire-perf-compat",[vl]:"fire-rc",[Il]:"fire-rc-compat",[wl]:"fire-gcs",[Al]:"fire-gcs-compat",[Rl]:"fire-fst",[Sl]:"fire-fst-compat",[Cl]:"fire-vertex","fire-js":"fire-js",[Pl]:"fire-js-all"};/**
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
 */const mn=new Map,Dl=new Map,as=new Map;function uo(r,t){try{r.container.addComponent(t)}catch(e){Lt.debug(`Component ${t.name} failed to register with FirebaseApp ${r.name}`,e)}}function Jn(r){const t=r.name;if(as.has(t))return Lt.debug(`There were multiple attempts to register component ${t}.`),!1;as.set(t,r);for(const e of mn.values())uo(e,r);for(const e of Dl.values())uo(e,r);return!0}function Nl(r,t){const e=r.container.getProvider("heartbeat").getImmediate({optional:!0});return e&&e.triggerHeartbeat(),r.container.getProvider(t)}function xl(r){return r==null?!1:r.settings!==void 0}/**
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
 */const kl={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},Qt=new ga("app","Firebase",kl);/**
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
 */class Ol{constructor(t,e,n){this._isDeleted=!1,this._options={...t},this._config={...e},this._name=e.name,this._automaticDataCollectionEnabled=e.automaticDataCollectionEnabled,this._container=n,this.container.addComponent(new fn("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(t){this.checkDestroyed(),this._automaticDataCollectionEnabled=t}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(t){this._isDeleted=t}checkDestroyed(){if(this.isDeleted)throw Qt.create("app-deleted",{appName:this._name})}}/**
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
 */const Ml=bl;function Ea(r,t={}){let e=r;typeof t!="object"&&(t={name:t});const n={name:os,automaticDataCollectionEnabled:!0,...t},i=n.name;if(typeof i!="string"||!i)throw Qt.create("bad-app-name",{appName:String(i)});if(e||(e=ma()),!e)throw Qt.create("no-options");const o=mn.get(i);if(o){if(Yn(e,o.options)&&Yn(n,o.config))return o;throw Qt.create("duplicate-app",{appName:i})}const c=new Uu(i);for(const d of as.values())c.addComponent(d);const l=new Ol(e,n,c);return mn.set(i,l),l}function Ll(r=os){const t=mn.get(r);if(!t&&r===os&&ma())return Ea();if(!t)throw Qt.create("no-app",{appName:r});return t}function lo(){return Array.from(mn.values())}function Ce(r,t,e){let n=Vl[r]??r;e&&(n+=`-${e}`);const i=n.match(/\s|\//),o=t.match(/\s|\//);if(i||o){const c=[`Unable to register library "${n}" with version "${t}":`];i&&c.push(`library name "${n}" contains illegal characters (whitespace or "/")`),i&&o&&c.push("and"),o&&c.push(`version name "${t}" contains illegal characters (whitespace or "/")`),Lt.warn(c.join(" "));return}Jn(new fn(`${n}-version`,()=>({library:n,version:t}),"VERSION"))}/**
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
 */const Fl="firebase-heartbeat-database",Ul=1,gn="firebase-heartbeat-store";let zr=null;function Ta(){return zr||(zr=Ju(Fl,Ul,{upgrade:(r,t)=>{switch(t){case 0:try{r.createObjectStore(gn)}catch(e){console.warn(e)}}}}).catch(r=>{throw Qt.create("idb-open",{originalErrorMessage:r.message})})),zr}async function Bl(r){try{const e=(await Ta()).transaction(gn),n=await e.objectStore(gn).get(va(r));return await e.done,n}catch(t){if(t instanceof Me)Lt.warn(t.message);else{const e=Qt.create("idb-get",{originalErrorMessage:t==null?void 0:t.message});Lt.warn(e.message)}}}async function ho(r,t){try{const n=(await Ta()).transaction(gn,"readwrite");await n.objectStore(gn).put(t,va(r)),await n.done}catch(e){if(e instanceof Me)Lt.warn(e.message);else{const n=Qt.create("idb-set",{originalErrorMessage:e==null?void 0:e.message});Lt.warn(n.message)}}}function va(r){return`${r.name}!${r.options.appId}`}/**
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
 */const jl=1024,ql=30;class $l{constructor(t){this.container=t,this._heartbeatsCache=null;const e=this.container.getProvider("app").getImmediate();this._storage=new Hl(e),this._heartbeatsCachePromise=this._storage.read().then(n=>(this._heartbeatsCache=n,n))}async triggerHeartbeat(){var t,e;try{const i=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),o=fo();if(((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===o||this._heartbeatsCache.heartbeats.some(c=>c.date===o))return;if(this._heartbeatsCache.heartbeats.push({date:o,agent:i}),this._heartbeatsCache.heartbeats.length>ql){const c=Gl(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(c,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(n){Lt.warn(n)}}async getHeartbeatsHeader(){var t;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const e=fo(),{heartbeatsToSend:n,unsentEntries:i}=zl(this._heartbeatsCache.heartbeats),o=Xn(JSON.stringify({version:2,heartbeats:n}));return this._heartbeatsCache.lastSentHeartbeatDate=e,i.length>0?(this._heartbeatsCache.heartbeats=i,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),o}catch(e){return Lt.warn(e),""}}}function fo(){return new Date().toISOString().substring(0,10)}function zl(r,t=jl){const e=[];let n=r.slice();for(const i of r){const o=e.find(c=>c.agent===i.agent);if(o){if(o.dates.push(i.date),mo(e)>t){o.dates.pop();break}}else if(e.push({agent:i.agent,dates:[i.date]}),mo(e)>t){e.pop();break}n=n.slice(1)}return{heartbeatsToSend:e,unsentEntries:n}}class Hl{constructor(t){this.app=t,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Vu()?Du().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const e=await Bl(this.app);return e!=null&&e.heartbeats?e:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(t){if(await this._canUseIndexedDBPromise){const n=await this.read();return ho(this.app,{lastSentHeartbeatDate:t.lastSentHeartbeatDate??n.lastSentHeartbeatDate,heartbeats:t.heartbeats})}else return}async add(t){if(await this._canUseIndexedDBPromise){const n=await this.read();return ho(this.app,{lastSentHeartbeatDate:t.lastSentHeartbeatDate??n.lastSentHeartbeatDate,heartbeats:[...n.heartbeats,...t.heartbeats]})}else return}}function mo(r){return Xn(JSON.stringify({version:2,heartbeats:r})).length}function Gl(r){if(r.length===0)return-1;let t=0,e=r[0].date;for(let n=1;n<r.length;n++)r[n].date<e&&(e=r[n].date,t=n);return t}/**
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
 */function Kl(r){Jn(new fn("platform-logger",t=>new el(t),"PRIVATE")),Jn(new fn("heartbeat",t=>new $l(t),"PRIVATE")),Ce(is,co,r),Ce(is,co,"esm2020"),Ce("fire-js","")}Kl("");var Ql="firebase",Wl="12.6.0";/**
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
 */Ce(Ql,Wl,"app");var go=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Wt,Ia;(function(){var r;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function t(E,m){function p(){}p.prototype=m.prototype,E.F=m.prototype,E.prototype=new p,E.prototype.constructor=E,E.D=function(T,y,w){for(var g=Array(arguments.length-2),ut=2;ut<arguments.length;ut++)g[ut-2]=arguments[ut];return m.prototype[y].apply(T,g)}}function e(){this.blockSize=-1}function n(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.C=Array(this.blockSize),this.o=this.h=0,this.u()}t(n,e),n.prototype.u=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function i(E,m,p){p||(p=0);const T=Array(16);if(typeof m=="string")for(var y=0;y<16;++y)T[y]=m.charCodeAt(p++)|m.charCodeAt(p++)<<8|m.charCodeAt(p++)<<16|m.charCodeAt(p++)<<24;else for(y=0;y<16;++y)T[y]=m[p++]|m[p++]<<8|m[p++]<<16|m[p++]<<24;m=E.g[0],p=E.g[1],y=E.g[2];let w=E.g[3],g;g=m+(w^p&(y^w))+T[0]+3614090360&4294967295,m=p+(g<<7&4294967295|g>>>25),g=w+(y^m&(p^y))+T[1]+3905402710&4294967295,w=m+(g<<12&4294967295|g>>>20),g=y+(p^w&(m^p))+T[2]+606105819&4294967295,y=w+(g<<17&4294967295|g>>>15),g=p+(m^y&(w^m))+T[3]+3250441966&4294967295,p=y+(g<<22&4294967295|g>>>10),g=m+(w^p&(y^w))+T[4]+4118548399&4294967295,m=p+(g<<7&4294967295|g>>>25),g=w+(y^m&(p^y))+T[5]+1200080426&4294967295,w=m+(g<<12&4294967295|g>>>20),g=y+(p^w&(m^p))+T[6]+2821735955&4294967295,y=w+(g<<17&4294967295|g>>>15),g=p+(m^y&(w^m))+T[7]+4249261313&4294967295,p=y+(g<<22&4294967295|g>>>10),g=m+(w^p&(y^w))+T[8]+1770035416&4294967295,m=p+(g<<7&4294967295|g>>>25),g=w+(y^m&(p^y))+T[9]+2336552879&4294967295,w=m+(g<<12&4294967295|g>>>20),g=y+(p^w&(m^p))+T[10]+4294925233&4294967295,y=w+(g<<17&4294967295|g>>>15),g=p+(m^y&(w^m))+T[11]+2304563134&4294967295,p=y+(g<<22&4294967295|g>>>10),g=m+(w^p&(y^w))+T[12]+1804603682&4294967295,m=p+(g<<7&4294967295|g>>>25),g=w+(y^m&(p^y))+T[13]+4254626195&4294967295,w=m+(g<<12&4294967295|g>>>20),g=y+(p^w&(m^p))+T[14]+2792965006&4294967295,y=w+(g<<17&4294967295|g>>>15),g=p+(m^y&(w^m))+T[15]+1236535329&4294967295,p=y+(g<<22&4294967295|g>>>10),g=m+(y^w&(p^y))+T[1]+4129170786&4294967295,m=p+(g<<5&4294967295|g>>>27),g=w+(p^y&(m^p))+T[6]+3225465664&4294967295,w=m+(g<<9&4294967295|g>>>23),g=y+(m^p&(w^m))+T[11]+643717713&4294967295,y=w+(g<<14&4294967295|g>>>18),g=p+(w^m&(y^w))+T[0]+3921069994&4294967295,p=y+(g<<20&4294967295|g>>>12),g=m+(y^w&(p^y))+T[5]+3593408605&4294967295,m=p+(g<<5&4294967295|g>>>27),g=w+(p^y&(m^p))+T[10]+38016083&4294967295,w=m+(g<<9&4294967295|g>>>23),g=y+(m^p&(w^m))+T[15]+3634488961&4294967295,y=w+(g<<14&4294967295|g>>>18),g=p+(w^m&(y^w))+T[4]+3889429448&4294967295,p=y+(g<<20&4294967295|g>>>12),g=m+(y^w&(p^y))+T[9]+568446438&4294967295,m=p+(g<<5&4294967295|g>>>27),g=w+(p^y&(m^p))+T[14]+3275163606&4294967295,w=m+(g<<9&4294967295|g>>>23),g=y+(m^p&(w^m))+T[3]+4107603335&4294967295,y=w+(g<<14&4294967295|g>>>18),g=p+(w^m&(y^w))+T[8]+1163531501&4294967295,p=y+(g<<20&4294967295|g>>>12),g=m+(y^w&(p^y))+T[13]+2850285829&4294967295,m=p+(g<<5&4294967295|g>>>27),g=w+(p^y&(m^p))+T[2]+4243563512&4294967295,w=m+(g<<9&4294967295|g>>>23),g=y+(m^p&(w^m))+T[7]+1735328473&4294967295,y=w+(g<<14&4294967295|g>>>18),g=p+(w^m&(y^w))+T[12]+2368359562&4294967295,p=y+(g<<20&4294967295|g>>>12),g=m+(p^y^w)+T[5]+4294588738&4294967295,m=p+(g<<4&4294967295|g>>>28),g=w+(m^p^y)+T[8]+2272392833&4294967295,w=m+(g<<11&4294967295|g>>>21),g=y+(w^m^p)+T[11]+1839030562&4294967295,y=w+(g<<16&4294967295|g>>>16),g=p+(y^w^m)+T[14]+4259657740&4294967295,p=y+(g<<23&4294967295|g>>>9),g=m+(p^y^w)+T[1]+2763975236&4294967295,m=p+(g<<4&4294967295|g>>>28),g=w+(m^p^y)+T[4]+1272893353&4294967295,w=m+(g<<11&4294967295|g>>>21),g=y+(w^m^p)+T[7]+4139469664&4294967295,y=w+(g<<16&4294967295|g>>>16),g=p+(y^w^m)+T[10]+3200236656&4294967295,p=y+(g<<23&4294967295|g>>>9),g=m+(p^y^w)+T[13]+681279174&4294967295,m=p+(g<<4&4294967295|g>>>28),g=w+(m^p^y)+T[0]+3936430074&4294967295,w=m+(g<<11&4294967295|g>>>21),g=y+(w^m^p)+T[3]+3572445317&4294967295,y=w+(g<<16&4294967295|g>>>16),g=p+(y^w^m)+T[6]+76029189&4294967295,p=y+(g<<23&4294967295|g>>>9),g=m+(p^y^w)+T[9]+3654602809&4294967295,m=p+(g<<4&4294967295|g>>>28),g=w+(m^p^y)+T[12]+3873151461&4294967295,w=m+(g<<11&4294967295|g>>>21),g=y+(w^m^p)+T[15]+530742520&4294967295,y=w+(g<<16&4294967295|g>>>16),g=p+(y^w^m)+T[2]+3299628645&4294967295,p=y+(g<<23&4294967295|g>>>9),g=m+(y^(p|~w))+T[0]+4096336452&4294967295,m=p+(g<<6&4294967295|g>>>26),g=w+(p^(m|~y))+T[7]+1126891415&4294967295,w=m+(g<<10&4294967295|g>>>22),g=y+(m^(w|~p))+T[14]+2878612391&4294967295,y=w+(g<<15&4294967295|g>>>17),g=p+(w^(y|~m))+T[5]+4237533241&4294967295,p=y+(g<<21&4294967295|g>>>11),g=m+(y^(p|~w))+T[12]+1700485571&4294967295,m=p+(g<<6&4294967295|g>>>26),g=w+(p^(m|~y))+T[3]+2399980690&4294967295,w=m+(g<<10&4294967295|g>>>22),g=y+(m^(w|~p))+T[10]+4293915773&4294967295,y=w+(g<<15&4294967295|g>>>17),g=p+(w^(y|~m))+T[1]+2240044497&4294967295,p=y+(g<<21&4294967295|g>>>11),g=m+(y^(p|~w))+T[8]+1873313359&4294967295,m=p+(g<<6&4294967295|g>>>26),g=w+(p^(m|~y))+T[15]+4264355552&4294967295,w=m+(g<<10&4294967295|g>>>22),g=y+(m^(w|~p))+T[6]+2734768916&4294967295,y=w+(g<<15&4294967295|g>>>17),g=p+(w^(y|~m))+T[13]+1309151649&4294967295,p=y+(g<<21&4294967295|g>>>11),g=m+(y^(p|~w))+T[4]+4149444226&4294967295,m=p+(g<<6&4294967295|g>>>26),g=w+(p^(m|~y))+T[11]+3174756917&4294967295,w=m+(g<<10&4294967295|g>>>22),g=y+(m^(w|~p))+T[2]+718787259&4294967295,y=w+(g<<15&4294967295|g>>>17),g=p+(w^(y|~m))+T[9]+3951481745&4294967295,E.g[0]=E.g[0]+m&4294967295,E.g[1]=E.g[1]+(y+(g<<21&4294967295|g>>>11))&4294967295,E.g[2]=E.g[2]+y&4294967295,E.g[3]=E.g[3]+w&4294967295}n.prototype.v=function(E,m){m===void 0&&(m=E.length);const p=m-this.blockSize,T=this.C;let y=this.h,w=0;for(;w<m;){if(y==0)for(;w<=p;)i(this,E,w),w+=this.blockSize;if(typeof E=="string"){for(;w<m;)if(T[y++]=E.charCodeAt(w++),y==this.blockSize){i(this,T),y=0;break}}else for(;w<m;)if(T[y++]=E[w++],y==this.blockSize){i(this,T),y=0;break}}this.h=y,this.o+=m},n.prototype.A=function(){var E=Array((this.h<56?this.blockSize:this.blockSize*2)-this.h);E[0]=128;for(var m=1;m<E.length-8;++m)E[m]=0;m=this.o*8;for(var p=E.length-8;p<E.length;++p)E[p]=m&255,m/=256;for(this.v(E),E=Array(16),m=0,p=0;p<4;++p)for(let T=0;T<32;T+=8)E[m++]=this.g[p]>>>T&255;return E};function o(E,m){var p=l;return Object.prototype.hasOwnProperty.call(p,E)?p[E]:p[E]=m(E)}function c(E,m){this.h=m;const p=[];let T=!0;for(let y=E.length-1;y>=0;y--){const w=E[y]|0;T&&w==m||(p[y]=w,T=!1)}this.g=p}var l={};function d(E){return-128<=E&&E<128?o(E,function(m){return new c([m|0],m<0?-1:0)}):new c([E|0],E<0?-1:0)}function f(E){if(isNaN(E)||!isFinite(E))return v;if(E<0)return D(f(-E));const m=[];let p=1;for(let T=0;E>=p;T++)m[T]=E/p|0,p*=4294967296;return new c(m,0)}function _(E,m){if(E.length==0)throw Error("number format error: empty string");if(m=m||10,m<2||36<m)throw Error("radix out of range: "+m);if(E.charAt(0)=="-")return D(_(E.substring(1),m));if(E.indexOf("-")>=0)throw Error('number format error: interior "-" character');const p=f(Math.pow(m,8));let T=v;for(let w=0;w<E.length;w+=8){var y=Math.min(8,E.length-w);const g=parseInt(E.substring(w,w+y),m);y<8?(y=f(Math.pow(m,y)),T=T.j(y).add(f(g))):(T=T.j(p),T=T.add(f(g)))}return T}var v=d(0),R=d(1),S=d(16777216);r=c.prototype,r.m=function(){if(M(this))return-D(this).m();let E=0,m=1;for(let p=0;p<this.g.length;p++){const T=this.i(p);E+=(T>=0?T:4294967296+T)*m,m*=4294967296}return E},r.toString=function(E){if(E=E||10,E<2||36<E)throw Error("radix out of range: "+E);if(N(this))return"0";if(M(this))return"-"+D(this).toString(E);const m=f(Math.pow(E,6));var p=this;let T="";for(;;){const y=tt(p,m).g;p=Q(p,y.j(m));let w=((p.g.length>0?p.g[0]:p.h)>>>0).toString(E);if(p=y,N(p))return w+T;for(;w.length<6;)w="0"+w;T=w+T}},r.i=function(E){return E<0?0:E<this.g.length?this.g[E]:this.h};function N(E){if(E.h!=0)return!1;for(let m=0;m<E.g.length;m++)if(E.g[m]!=0)return!1;return!0}function M(E){return E.h==-1}r.l=function(E){return E=Q(this,E),M(E)?-1:N(E)?0:1};function D(E){const m=E.g.length,p=[];for(let T=0;T<m;T++)p[T]=~E.g[T];return new c(p,~E.h).add(R)}r.abs=function(){return M(this)?D(this):this},r.add=function(E){const m=Math.max(this.g.length,E.g.length),p=[];let T=0;for(let y=0;y<=m;y++){let w=T+(this.i(y)&65535)+(E.i(y)&65535),g=(w>>>16)+(this.i(y)>>>16)+(E.i(y)>>>16);T=g>>>16,w&=65535,g&=65535,p[y]=g<<16|w}return new c(p,p[p.length-1]&-2147483648?-1:0)};function Q(E,m){return E.add(D(m))}r.j=function(E){if(N(this)||N(E))return v;if(M(this))return M(E)?D(this).j(D(E)):D(D(this).j(E));if(M(E))return D(this.j(D(E)));if(this.l(S)<0&&E.l(S)<0)return f(this.m()*E.m());const m=this.g.length+E.g.length,p=[];for(var T=0;T<2*m;T++)p[T]=0;for(T=0;T<this.g.length;T++)for(let y=0;y<E.g.length;y++){const w=this.i(T)>>>16,g=this.i(T)&65535,ut=E.i(y)>>>16,lt=E.i(y)&65535;p[2*T+2*y]+=g*lt,H(p,2*T+2*y),p[2*T+2*y+1]+=w*lt,H(p,2*T+2*y+1),p[2*T+2*y+1]+=g*ut,H(p,2*T+2*y+1),p[2*T+2*y+2]+=w*ut,H(p,2*T+2*y+2)}for(E=0;E<m;E++)p[E]=p[2*E+1]<<16|p[2*E];for(E=m;E<2*m;E++)p[E]=0;return new c(p,0)};function H(E,m){for(;(E[m]&65535)!=E[m];)E[m+1]+=E[m]>>>16,E[m]&=65535,m++}function G(E,m){this.g=E,this.h=m}function tt(E,m){if(N(m))throw Error("division by zero");if(N(E))return new G(v,v);if(M(E))return m=tt(D(E),m),new G(D(m.g),D(m.h));if(M(m))return m=tt(E,D(m)),new G(D(m.g),m.h);if(E.g.length>30){if(M(E)||M(m))throw Error("slowDivide_ only works with positive integers.");for(var p=R,T=m;T.l(E)<=0;)p=gt(p),T=gt(T);var y=J(p,1),w=J(T,1);for(T=J(T,2),p=J(p,2);!N(T);){var g=w.add(T);g.l(E)<=0&&(y=y.add(p),w=g),T=J(T,1),p=J(p,1)}return m=Q(E,y.j(m)),new G(y,m)}for(y=v;E.l(m)>=0;){for(p=Math.max(1,Math.floor(E.m()/m.m())),T=Math.ceil(Math.log(p)/Math.LN2),T=T<=48?1:Math.pow(2,T-48),w=f(p),g=w.j(m);M(g)||g.l(E)>0;)p-=T,w=f(p),g=w.j(m);N(w)&&(w=R),y=y.add(w),E=Q(E,g)}return new G(y,E)}r.B=function(E){return tt(this,E).h},r.and=function(E){const m=Math.max(this.g.length,E.g.length),p=[];for(let T=0;T<m;T++)p[T]=this.i(T)&E.i(T);return new c(p,this.h&E.h)},r.or=function(E){const m=Math.max(this.g.length,E.g.length),p=[];for(let T=0;T<m;T++)p[T]=this.i(T)|E.i(T);return new c(p,this.h|E.h)},r.xor=function(E){const m=Math.max(this.g.length,E.g.length),p=[];for(let T=0;T<m;T++)p[T]=this.i(T)^E.i(T);return new c(p,this.h^E.h)};function gt(E){const m=E.g.length+1,p=[];for(let T=0;T<m;T++)p[T]=E.i(T)<<1|E.i(T-1)>>>31;return new c(p,E.h)}function J(E,m){const p=m>>5;m%=32;const T=E.g.length-p,y=[];for(let w=0;w<T;w++)y[w]=m>0?E.i(w+p)>>>m|E.i(w+p+1)<<32-m:E.i(w+p);return new c(y,E.h)}n.prototype.digest=n.prototype.A,n.prototype.reset=n.prototype.u,n.prototype.update=n.prototype.v,Ia=n,c.prototype.add=c.prototype.add,c.prototype.multiply=c.prototype.j,c.prototype.modulo=c.prototype.B,c.prototype.compare=c.prototype.l,c.prototype.toNumber=c.prototype.m,c.prototype.toString=c.prototype.toString,c.prototype.getBits=c.prototype.i,c.fromNumber=f,c.fromString=_,Wt=c}).apply(typeof go<"u"?go:typeof self<"u"?self:typeof window<"u"?window:{});var Bn=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var wa,nn,Aa,Hn,cs,Ra,Ca,Sa;(function(){var r,t=Object.defineProperty;function e(s){s=[typeof globalThis=="object"&&globalThis,s,typeof window=="object"&&window,typeof self=="object"&&self,typeof Bn=="object"&&Bn];for(var a=0;a<s.length;++a){var u=s[a];if(u&&u.Math==Math)return u}throw Error("Cannot find global object")}var n=e(this);function i(s,a){if(a)t:{var u=n;s=s.split(".");for(var h=0;h<s.length-1;h++){var I=s[h];if(!(I in u))break t;u=u[I]}s=s[s.length-1],h=u[s],a=a(h),a!=h&&a!=null&&t(u,s,{configurable:!0,writable:!0,value:a})}}i("Symbol.dispose",function(s){return s||Symbol("Symbol.dispose")}),i("Array.prototype.values",function(s){return s||function(){return this[Symbol.iterator]()}}),i("Object.entries",function(s){return s||function(a){var u=[],h;for(h in a)Object.prototype.hasOwnProperty.call(a,h)&&u.push([h,a[h]]);return u}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var o=o||{},c=this||self;function l(s){var a=typeof s;return a=="object"&&s!=null||a=="function"}function d(s,a,u){return s.call.apply(s.bind,arguments)}function f(s,a,u){return f=d,f.apply(null,arguments)}function _(s,a){var u=Array.prototype.slice.call(arguments,1);return function(){var h=u.slice();return h.push.apply(h,arguments),s.apply(this,h)}}function v(s,a){function u(){}u.prototype=a.prototype,s.Z=a.prototype,s.prototype=new u,s.prototype.constructor=s,s.Ob=function(h,I,A){for(var b=Array(arguments.length-2),U=2;U<arguments.length;U++)b[U-2]=arguments[U];return a.prototype[I].apply(h,b)}}var R=typeof AsyncContext<"u"&&typeof AsyncContext.Snapshot=="function"?s=>s&&AsyncContext.Snapshot.wrap(s):s=>s;function S(s){const a=s.length;if(a>0){const u=Array(a);for(let h=0;h<a;h++)u[h]=s[h];return u}return[]}function N(s,a){for(let h=1;h<arguments.length;h++){const I=arguments[h];var u=typeof I;if(u=u!="object"?u:I?Array.isArray(I)?"array":u:"null",u=="array"||u=="object"&&typeof I.length=="number"){u=s.length||0;const A=I.length||0;s.length=u+A;for(let b=0;b<A;b++)s[u+b]=I[b]}else s.push(I)}}class M{constructor(a,u){this.i=a,this.j=u,this.h=0,this.g=null}get(){let a;return this.h>0?(this.h--,a=this.g,this.g=a.next,a.next=null):a=this.i(),a}}function D(s){c.setTimeout(()=>{throw s},0)}function Q(){var s=E;let a=null;return s.g&&(a=s.g,s.g=s.g.next,s.g||(s.h=null),a.next=null),a}class H{constructor(){this.h=this.g=null}add(a,u){const h=G.get();h.set(a,u),this.h?this.h.next=h:this.g=h,this.h=h}}var G=new M(()=>new tt,s=>s.reset());class tt{constructor(){this.next=this.g=this.h=null}set(a,u){this.h=a,this.g=u,this.next=null}reset(){this.next=this.g=this.h=null}}let gt,J=!1,E=new H,m=()=>{const s=Promise.resolve(void 0);gt=()=>{s.then(p)}};function p(){for(var s;s=Q();){try{s.h.call(s.g)}catch(u){D(u)}var a=G;a.j(s),a.h<100&&(a.h++,s.next=a.g,a.g=s)}J=!1}function T(){this.u=this.u,this.C=this.C}T.prototype.u=!1,T.prototype.dispose=function(){this.u||(this.u=!0,this.N())},T.prototype[Symbol.dispose]=function(){this.dispose()},T.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function y(s,a){this.type=s,this.g=this.target=a,this.defaultPrevented=!1}y.prototype.h=function(){this.defaultPrevented=!0};var w=function(){if(!c.addEventListener||!Object.defineProperty)return!1;var s=!1,a=Object.defineProperty({},"passive",{get:function(){s=!0}});try{const u=()=>{};c.addEventListener("test",u,a),c.removeEventListener("test",u,a)}catch{}return s}();function g(s){return/^[\s\xa0]*$/.test(s)}function ut(s,a){y.call(this,s?s.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,s&&this.init(s,a)}v(ut,y),ut.prototype.init=function(s,a){const u=this.type=s.type,h=s.changedTouches&&s.changedTouches.length?s.changedTouches[0]:null;this.target=s.target||s.srcElement,this.g=a,a=s.relatedTarget,a||(u=="mouseover"?a=s.fromElement:u=="mouseout"&&(a=s.toElement)),this.relatedTarget=a,h?(this.clientX=h.clientX!==void 0?h.clientX:h.pageX,this.clientY=h.clientY!==void 0?h.clientY:h.pageY,this.screenX=h.screenX||0,this.screenY=h.screenY||0):(this.clientX=s.clientX!==void 0?s.clientX:s.pageX,this.clientY=s.clientY!==void 0?s.clientY:s.pageY,this.screenX=s.screenX||0,this.screenY=s.screenY||0),this.button=s.button,this.key=s.key||"",this.ctrlKey=s.ctrlKey,this.altKey=s.altKey,this.shiftKey=s.shiftKey,this.metaKey=s.metaKey,this.pointerId=s.pointerId||0,this.pointerType=s.pointerType,this.state=s.state,this.i=s,s.defaultPrevented&&ut.Z.h.call(this)},ut.prototype.h=function(){ut.Z.h.call(this);const s=this.i;s.preventDefault?s.preventDefault():s.returnValue=!1};var lt="closure_listenable_"+(Math.random()*1e6|0),Ct=0;function Mt(s,a,u,h,I){this.listener=s,this.proxy=null,this.src=a,this.type=u,this.capture=!!h,this.ha=I,this.key=++Ct,this.da=this.fa=!1}function _e(s){s.da=!0,s.listener=null,s.proxy=null,s.src=null,s.ha=null}function Cn(s,a,u){for(const h in s)a.call(u,s[h],h,s)}function kc(s,a){for(const u in s)a.call(void 0,s[u],u,s)}function ei(s){const a={};for(const u in s)a[u]=s[u];return a}const ni="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function ri(s,a){let u,h;for(let I=1;I<arguments.length;I++){h=arguments[I];for(u in h)s[u]=h[u];for(let A=0;A<ni.length;A++)u=ni[A],Object.prototype.hasOwnProperty.call(h,u)&&(s[u]=h[u])}}function Sn(s){this.src=s,this.g={},this.h=0}Sn.prototype.add=function(s,a,u,h,I){const A=s.toString();s=this.g[A],s||(s=this.g[A]=[],this.h++);const b=yr(s,a,h,I);return b>-1?(a=s[b],u||(a.fa=!1)):(a=new Mt(a,this.src,A,!!h,I),a.fa=u,s.push(a)),a};function _r(s,a){const u=a.type;if(u in s.g){var h=s.g[u],I=Array.prototype.indexOf.call(h,a,void 0),A;(A=I>=0)&&Array.prototype.splice.call(h,I,1),A&&(_e(a),s.g[u].length==0&&(delete s.g[u],s.h--))}}function yr(s,a,u,h){for(let I=0;I<s.length;++I){const A=s[I];if(!A.da&&A.listener==a&&A.capture==!!u&&A.ha==h)return I}return-1}var Er="closure_lm_"+(Math.random()*1e6|0),Tr={};function si(s,a,u,h,I){if(Array.isArray(a)){for(let A=0;A<a.length;A++)si(s,a[A],u,h,I);return null}return u=ai(u),s&&s[lt]?s.J(a,u,l(h)?!!h.capture:!1,I):Oc(s,a,u,!1,h,I)}function Oc(s,a,u,h,I,A){if(!a)throw Error("Invalid event type");const b=l(I)?!!I.capture:!!I;let U=Ir(s);if(U||(s[Er]=U=new Sn(s)),u=U.add(a,u,h,b,A),u.proxy)return u;if(h=Mc(),u.proxy=h,h.src=s,h.listener=u,s.addEventListener)w||(I=b),I===void 0&&(I=!1),s.addEventListener(a.toString(),h,I);else if(s.attachEvent)s.attachEvent(oi(a.toString()),h);else if(s.addListener&&s.removeListener)s.addListener(h);else throw Error("addEventListener and attachEvent are unavailable.");return u}function Mc(){function s(u){return a.call(s.src,s.listener,u)}const a=Lc;return s}function ii(s,a,u,h,I){if(Array.isArray(a))for(var A=0;A<a.length;A++)ii(s,a[A],u,h,I);else h=l(h)?!!h.capture:!!h,u=ai(u),s&&s[lt]?(s=s.i,A=String(a).toString(),A in s.g&&(a=s.g[A],u=yr(a,u,h,I),u>-1&&(_e(a[u]),Array.prototype.splice.call(a,u,1),a.length==0&&(delete s.g[A],s.h--)))):s&&(s=Ir(s))&&(a=s.g[a.toString()],s=-1,a&&(s=yr(a,u,h,I)),(u=s>-1?a[s]:null)&&vr(u))}function vr(s){if(typeof s!="number"&&s&&!s.da){var a=s.src;if(a&&a[lt])_r(a.i,s);else{var u=s.type,h=s.proxy;a.removeEventListener?a.removeEventListener(u,h,s.capture):a.detachEvent?a.detachEvent(oi(u),h):a.addListener&&a.removeListener&&a.removeListener(h),(u=Ir(a))?(_r(u,s),u.h==0&&(u.src=null,a[Er]=null)):_e(s)}}}function oi(s){return s in Tr?Tr[s]:Tr[s]="on"+s}function Lc(s,a){if(s.da)s=!0;else{a=new ut(a,this);const u=s.listener,h=s.ha||s.src;s.fa&&vr(s),s=u.call(h,a)}return s}function Ir(s){return s=s[Er],s instanceof Sn?s:null}var wr="__closure_events_fn_"+(Math.random()*1e9>>>0);function ai(s){return typeof s=="function"?s:(s[wr]||(s[wr]=function(a){return s.handleEvent(a)}),s[wr])}function pt(){T.call(this),this.i=new Sn(this),this.M=this,this.G=null}v(pt,T),pt.prototype[lt]=!0,pt.prototype.removeEventListener=function(s,a,u,h){ii(this,s,a,u,h)};function Tt(s,a){var u,h=s.G;if(h)for(u=[];h;h=h.G)u.push(h);if(s=s.M,h=a.type||a,typeof a=="string")a=new y(a,s);else if(a instanceof y)a.target=a.target||s;else{var I=a;a=new y(h,s),ri(a,I)}I=!0;let A,b;if(u)for(b=u.length-1;b>=0;b--)A=a.g=u[b],I=Pn(A,h,!0,a)&&I;if(A=a.g=s,I=Pn(A,h,!0,a)&&I,I=Pn(A,h,!1,a)&&I,u)for(b=0;b<u.length;b++)A=a.g=u[b],I=Pn(A,h,!1,a)&&I}pt.prototype.N=function(){if(pt.Z.N.call(this),this.i){var s=this.i;for(const a in s.g){const u=s.g[a];for(let h=0;h<u.length;h++)_e(u[h]);delete s.g[a],s.h--}}this.G=null},pt.prototype.J=function(s,a,u,h){return this.i.add(String(s),a,!1,u,h)},pt.prototype.K=function(s,a,u,h){return this.i.add(String(s),a,!0,u,h)};function Pn(s,a,u,h){if(a=s.i.g[String(a)],!a)return!0;a=a.concat();let I=!0;for(let A=0;A<a.length;++A){const b=a[A];if(b&&!b.da&&b.capture==u){const U=b.listener,ot=b.ha||b.src;b.fa&&_r(s.i,b),I=U.call(ot,h)!==!1&&I}}return I&&!h.defaultPrevented}function Fc(s,a){if(typeof s!="function")if(s&&typeof s.handleEvent=="function")s=f(s.handleEvent,s);else throw Error("Invalid listener argument");return Number(a)>2147483647?-1:c.setTimeout(s,a||0)}function ci(s){s.g=Fc(()=>{s.g=null,s.i&&(s.i=!1,ci(s))},s.l);const a=s.h;s.h=null,s.m.apply(null,a)}class Uc extends T{constructor(a,u){super(),this.m=a,this.l=u,this.h=null,this.i=!1,this.g=null}j(a){this.h=arguments,this.g?this.i=!0:ci(this)}N(){super.N(),this.g&&(c.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function Be(s){T.call(this),this.h=s,this.g={}}v(Be,T);var ui=[];function li(s){Cn(s.g,function(a,u){this.g.hasOwnProperty(u)&&vr(a)},s),s.g={}}Be.prototype.N=function(){Be.Z.N.call(this),li(this)},Be.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var Ar=c.JSON.stringify,Bc=c.JSON.parse,jc=class{stringify(s){return c.JSON.stringify(s,void 0)}parse(s){return c.JSON.parse(s,void 0)}};function hi(){}function di(){}var je={OPEN:"a",hb:"b",ERROR:"c",tb:"d"};function Rr(){y.call(this,"d")}v(Rr,y);function Cr(){y.call(this,"c")}v(Cr,y);var se={},fi=null;function bn(){return fi=fi||new pt}se.Ia="serverreachability";function mi(s){y.call(this,se.Ia,s)}v(mi,y);function qe(s){const a=bn();Tt(a,new mi(a))}se.STAT_EVENT="statevent";function gi(s,a){y.call(this,se.STAT_EVENT,s),this.stat=a}v(gi,y);function vt(s){const a=bn();Tt(a,new gi(a,s))}se.Ja="timingevent";function pi(s,a){y.call(this,se.Ja,s),this.size=a}v(pi,y);function $e(s,a){if(typeof s!="function")throw Error("Fn must not be null and must be a function");return c.setTimeout(function(){s()},a)}function ze(){this.g=!0}ze.prototype.ua=function(){this.g=!1};function qc(s,a,u,h,I,A){s.info(function(){if(s.g)if(A){var b="",U=A.split("&");for(let K=0;K<U.length;K++){var ot=U[K].split("=");if(ot.length>1){const ht=ot[0];ot=ot[1];const bt=ht.split("_");b=bt.length>=2&&bt[1]=="type"?b+(ht+"="+ot+"&"):b+(ht+"=redacted&")}}}else b=null;else b=A;return"XMLHTTP REQ ("+h+") [attempt "+I+"]: "+a+`
`+u+`
`+b})}function $c(s,a,u,h,I,A,b){s.info(function(){return"XMLHTTP RESP ("+h+") [ attempt "+I+"]: "+a+`
`+u+`
`+A+" "+b})}function ye(s,a,u,h){s.info(function(){return"XMLHTTP TEXT ("+a+"): "+Hc(s,u)+(h?" "+h:"")})}function zc(s,a){s.info(function(){return"TIMEOUT: "+a})}ze.prototype.info=function(){};function Hc(s,a){if(!s.g)return a;if(!a)return null;try{const A=JSON.parse(a);if(A){for(s=0;s<A.length;s++)if(Array.isArray(A[s])){var u=A[s];if(!(u.length<2)){var h=u[1];if(Array.isArray(h)&&!(h.length<1)){var I=h[0];if(I!="noop"&&I!="stop"&&I!="close")for(let b=1;b<h.length;b++)h[b]=""}}}}return Ar(A)}catch{return a}}var Vn={NO_ERROR:0,cb:1,qb:2,pb:3,kb:4,ob:5,rb:6,Ga:7,TIMEOUT:8,ub:9},_i={ib:"complete",Fb:"success",ERROR:"error",Ga:"abort",xb:"ready",yb:"readystatechange",TIMEOUT:"timeout",sb:"incrementaldata",wb:"progress",lb:"downloadprogress",Nb:"uploadprogress"},yi;function Sr(){}v(Sr,hi),Sr.prototype.g=function(){return new XMLHttpRequest},yi=new Sr;function He(s){return encodeURIComponent(String(s))}function Gc(s){var a=1;s=s.split(":");const u=[];for(;a>0&&s.length;)u.push(s.shift()),a--;return s.length&&u.push(s.join(":")),u}function Ut(s,a,u,h){this.j=s,this.i=a,this.l=u,this.S=h||1,this.V=new Be(this),this.H=45e3,this.J=null,this.o=!1,this.u=this.B=this.A=this.M=this.F=this.T=this.D=null,this.G=[],this.g=null,this.C=0,this.m=this.v=null,this.X=-1,this.K=!1,this.P=0,this.O=null,this.W=this.L=this.U=this.R=!1,this.h=new Ei}function Ei(){this.i=null,this.g="",this.h=!1}var Ti={},Pr={};function br(s,a,u){s.M=1,s.A=Nn(Pt(a)),s.u=u,s.R=!0,vi(s,null)}function vi(s,a){s.F=Date.now(),Dn(s),s.B=Pt(s.A);var u=s.B,h=s.S;Array.isArray(h)||(h=[String(h)]),ki(u.i,"t",h),s.C=0,u=s.j.L,s.h=new Ei,s.g=Ji(s.j,u?a:null,!s.u),s.P>0&&(s.O=new Uc(f(s.Y,s,s.g),s.P)),a=s.V,u=s.g,h=s.ba;var I="readystatechange";Array.isArray(I)||(I&&(ui[0]=I.toString()),I=ui);for(let A=0;A<I.length;A++){const b=si(u,I[A],h||a.handleEvent,!1,a.h||a);if(!b)break;a.g[b.key]=b}a=s.J?ei(s.J):{},s.u?(s.v||(s.v="POST"),a["Content-Type"]="application/x-www-form-urlencoded",s.g.ea(s.B,s.v,s.u,a)):(s.v="GET",s.g.ea(s.B,s.v,null,a)),qe(),qc(s.i,s.v,s.B,s.l,s.S,s.u)}Ut.prototype.ba=function(s){s=s.target;const a=this.O;a&&qt(s)==3?a.j():this.Y(s)},Ut.prototype.Y=function(s){try{if(s==this.g)t:{const U=qt(this.g),ot=this.g.ya(),K=this.g.ca();if(!(U<3)&&(U!=3||this.g&&(this.h.h||this.g.la()||ji(this.g)))){this.K||U!=4||ot==7||(ot==8||K<=0?qe(3):qe(2)),Vr(this);var a=this.g.ca();this.X=a;var u=Kc(this);if(this.o=a==200,$c(this.i,this.v,this.B,this.l,this.S,U,a),this.o){if(this.U&&!this.L){e:{if(this.g){var h,I=this.g;if((h=I.g?I.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!g(h)){var A=h;break e}}A=null}if(s=A)ye(this.i,this.l,s,"Initial handshake response via X-HTTP-Initial-Response"),this.L=!0,Dr(this,s);else{this.o=!1,this.m=3,vt(12),ie(this),Ge(this);break t}}if(this.R){s=!0;let ht;for(;!this.K&&this.C<u.length;)if(ht=Qc(this,u),ht==Pr){U==4&&(this.m=4,vt(14),s=!1),ye(this.i,this.l,null,"[Incomplete Response]");break}else if(ht==Ti){this.m=4,vt(15),ye(this.i,this.l,u,"[Invalid Chunk]"),s=!1;break}else ye(this.i,this.l,ht,null),Dr(this,ht);if(Ii(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),U!=4||u.length!=0||this.h.h||(this.m=1,vt(16),s=!1),this.o=this.o&&s,!s)ye(this.i,this.l,u,"[Invalid Chunked Response]"),ie(this),Ge(this);else if(u.length>0&&!this.W){this.W=!0;var b=this.j;b.g==this&&b.aa&&!b.P&&(b.j.info("Great, no buffering proxy detected. Bytes received: "+u.length),Ur(b),b.P=!0,vt(11))}}else ye(this.i,this.l,u,null),Dr(this,u);U==4&&ie(this),this.o&&!this.K&&(U==4?Qi(this.j,this):(this.o=!1,Dn(this)))}else cu(this.g),a==400&&u.indexOf("Unknown SID")>0?(this.m=3,vt(12)):(this.m=0,vt(13)),ie(this),Ge(this)}}}catch{}finally{}};function Kc(s){if(!Ii(s))return s.g.la();const a=ji(s.g);if(a==="")return"";let u="";const h=a.length,I=qt(s.g)==4;if(!s.h.i){if(typeof TextDecoder>"u")return ie(s),Ge(s),"";s.h.i=new c.TextDecoder}for(let A=0;A<h;A++)s.h.h=!0,u+=s.h.i.decode(a[A],{stream:!(I&&A==h-1)});return a.length=0,s.h.g+=u,s.C=0,s.h.g}function Ii(s){return s.g?s.v=="GET"&&s.M!=2&&s.j.Aa:!1}function Qc(s,a){var u=s.C,h=a.indexOf(`
`,u);return h==-1?Pr:(u=Number(a.substring(u,h)),isNaN(u)?Ti:(h+=1,h+u>a.length?Pr:(a=a.slice(h,h+u),s.C=h+u,a)))}Ut.prototype.cancel=function(){this.K=!0,ie(this)};function Dn(s){s.T=Date.now()+s.H,wi(s,s.H)}function wi(s,a){if(s.D!=null)throw Error("WatchDog timer not null");s.D=$e(f(s.aa,s),a)}function Vr(s){s.D&&(c.clearTimeout(s.D),s.D=null)}Ut.prototype.aa=function(){this.D=null;const s=Date.now();s-this.T>=0?(zc(this.i,this.B),this.M!=2&&(qe(),vt(17)),ie(this),this.m=2,Ge(this)):wi(this,this.T-s)};function Ge(s){s.j.I==0||s.K||Qi(s.j,s)}function ie(s){Vr(s);var a=s.O;a&&typeof a.dispose=="function"&&a.dispose(),s.O=null,li(s.V),s.g&&(a=s.g,s.g=null,a.abort(),a.dispose())}function Dr(s,a){try{var u=s.j;if(u.I!=0&&(u.g==s||Nr(u.h,s))){if(!s.L&&Nr(u.h,s)&&u.I==3){try{var h=u.Ba.g.parse(a)}catch{h=null}if(Array.isArray(h)&&h.length==3){var I=h;if(I[0]==0){t:if(!u.v){if(u.g)if(u.g.F+3e3<s.F)Ln(u),On(u);else break t;Fr(u),vt(18)}}else u.xa=I[1],0<u.xa-u.K&&I[2]<37500&&u.F&&u.A==0&&!u.C&&(u.C=$e(f(u.Va,u),6e3));Ci(u.h)<=1&&u.ta&&(u.ta=void 0)}else ae(u,11)}else if((s.L||u.g==s)&&Ln(u),!g(a))for(I=u.Ba.g.parse(a),a=0;a<I.length;a++){let K=I[a];const ht=K[0];if(!(ht<=u.K))if(u.K=ht,K=K[1],u.I==2)if(K[0]=="c"){u.M=K[1],u.ba=K[2];const bt=K[3];bt!=null&&(u.ka=bt,u.j.info("VER="+u.ka));const ce=K[4];ce!=null&&(u.za=ce,u.j.info("SVER="+u.za));const $t=K[5];$t!=null&&typeof $t=="number"&&$t>0&&(h=1.5*$t,u.O=h,u.j.info("backChannelRequestTimeoutMs_="+h)),h=u;const zt=s.g;if(zt){const Un=zt.g?zt.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(Un){var A=h.h;A.g||Un.indexOf("spdy")==-1&&Un.indexOf("quic")==-1&&Un.indexOf("h2")==-1||(A.j=A.l,A.g=new Set,A.h&&(xr(A,A.h),A.h=null))}if(h.G){const Br=zt.g?zt.g.getResponseHeader("X-HTTP-Session-Id"):null;Br&&(h.wa=Br,W(h.J,h.G,Br))}}u.I=3,u.l&&u.l.ra(),u.aa&&(u.T=Date.now()-s.F,u.j.info("Handshake RTT: "+u.T+"ms")),h=u;var b=s;if(h.na=Yi(h,h.L?h.ba:null,h.W),b.L){Si(h.h,b);var U=b,ot=h.O;ot&&(U.H=ot),U.D&&(Vr(U),Dn(U)),h.g=b}else Gi(h);u.i.length>0&&Mn(u)}else K[0]!="stop"&&K[0]!="close"||ae(u,7);else u.I==3&&(K[0]=="stop"||K[0]=="close"?K[0]=="stop"?ae(u,7):Lr(u):K[0]!="noop"&&u.l&&u.l.qa(K),u.A=0)}}qe(4)}catch{}}var Wc=class{constructor(s,a){this.g=s,this.map=a}};function Ai(s){this.l=s||10,c.PerformanceNavigationTiming?(s=c.performance.getEntriesByType("navigation"),s=s.length>0&&(s[0].nextHopProtocol=="hq"||s[0].nextHopProtocol=="h2")):s=!!(c.chrome&&c.chrome.loadTimes&&c.chrome.loadTimes()&&c.chrome.loadTimes().wasFetchedViaSpdy),this.j=s?this.l:1,this.g=null,this.j>1&&(this.g=new Set),this.h=null,this.i=[]}function Ri(s){return s.h?!0:s.g?s.g.size>=s.j:!1}function Ci(s){return s.h?1:s.g?s.g.size:0}function Nr(s,a){return s.h?s.h==a:s.g?s.g.has(a):!1}function xr(s,a){s.g?s.g.add(a):s.h=a}function Si(s,a){s.h&&s.h==a?s.h=null:s.g&&s.g.has(a)&&s.g.delete(a)}Ai.prototype.cancel=function(){if(this.i=Pi(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const s of this.g.values())s.cancel();this.g.clear()}};function Pi(s){if(s.h!=null)return s.i.concat(s.h.G);if(s.g!=null&&s.g.size!==0){let a=s.i;for(const u of s.g.values())a=a.concat(u.G);return a}return S(s.i)}var bi=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function Xc(s,a){if(s){s=s.split("&");for(let u=0;u<s.length;u++){const h=s[u].indexOf("=");let I,A=null;h>=0?(I=s[u].substring(0,h),A=s[u].substring(h+1)):I=s[u],a(I,A?decodeURIComponent(A.replace(/\+/g," ")):"")}}}function Bt(s){this.g=this.o=this.j="",this.u=null,this.m=this.h="",this.l=!1;let a;s instanceof Bt?(this.l=s.l,Ke(this,s.j),this.o=s.o,this.g=s.g,Qe(this,s.u),this.h=s.h,kr(this,Oi(s.i)),this.m=s.m):s&&(a=String(s).match(bi))?(this.l=!1,Ke(this,a[1]||"",!0),this.o=We(a[2]||""),this.g=We(a[3]||"",!0),Qe(this,a[4]),this.h=We(a[5]||"",!0),kr(this,a[6]||"",!0),this.m=We(a[7]||"")):(this.l=!1,this.i=new Ye(null,this.l))}Bt.prototype.toString=function(){const s=[];var a=this.j;a&&s.push(Xe(a,Vi,!0),":");var u=this.g;return(u||a=="file")&&(s.push("//"),(a=this.o)&&s.push(Xe(a,Vi,!0),"@"),s.push(He(u).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),u=this.u,u!=null&&s.push(":",String(u))),(u=this.h)&&(this.g&&u.charAt(0)!="/"&&s.push("/"),s.push(Xe(u,u.charAt(0)=="/"?Zc:Jc,!0))),(u=this.i.toString())&&s.push("?",u),(u=this.m)&&s.push("#",Xe(u,eu)),s.join("")},Bt.prototype.resolve=function(s){const a=Pt(this);let u=!!s.j;u?Ke(a,s.j):u=!!s.o,u?a.o=s.o:u=!!s.g,u?a.g=s.g:u=s.u!=null;var h=s.h;if(u)Qe(a,s.u);else if(u=!!s.h){if(h.charAt(0)!="/")if(this.g&&!this.h)h="/"+h;else{var I=a.h.lastIndexOf("/");I!=-1&&(h=a.h.slice(0,I+1)+h)}if(I=h,I==".."||I==".")h="";else if(I.indexOf("./")!=-1||I.indexOf("/.")!=-1){h=I.lastIndexOf("/",0)==0,I=I.split("/");const A=[];for(let b=0;b<I.length;){const U=I[b++];U=="."?h&&b==I.length&&A.push(""):U==".."?((A.length>1||A.length==1&&A[0]!="")&&A.pop(),h&&b==I.length&&A.push("")):(A.push(U),h=!0)}h=A.join("/")}else h=I}return u?a.h=h:u=s.i.toString()!=="",u?kr(a,Oi(s.i)):u=!!s.m,u&&(a.m=s.m),a};function Pt(s){return new Bt(s)}function Ke(s,a,u){s.j=u?We(a,!0):a,s.j&&(s.j=s.j.replace(/:$/,""))}function Qe(s,a){if(a){if(a=Number(a),isNaN(a)||a<0)throw Error("Bad port number "+a);s.u=a}else s.u=null}function kr(s,a,u){a instanceof Ye?(s.i=a,nu(s.i,s.l)):(u||(a=Xe(a,tu)),s.i=new Ye(a,s.l))}function W(s,a,u){s.i.set(a,u)}function Nn(s){return W(s,"zx",Math.floor(Math.random()*2147483648).toString(36)+Math.abs(Math.floor(Math.random()*2147483648)^Date.now()).toString(36)),s}function We(s,a){return s?a?decodeURI(s.replace(/%25/g,"%2525")):decodeURIComponent(s):""}function Xe(s,a,u){return typeof s=="string"?(s=encodeURI(s).replace(a,Yc),u&&(s=s.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),s):null}function Yc(s){return s=s.charCodeAt(0),"%"+(s>>4&15).toString(16)+(s&15).toString(16)}var Vi=/[#\/\?@]/g,Jc=/[#\?:]/g,Zc=/[#\?]/g,tu=/[#\?@]/g,eu=/#/g;function Ye(s,a){this.h=this.g=null,this.i=s||null,this.j=!!a}function oe(s){s.g||(s.g=new Map,s.h=0,s.i&&Xc(s.i,function(a,u){s.add(decodeURIComponent(a.replace(/\+/g," ")),u)}))}r=Ye.prototype,r.add=function(s,a){oe(this),this.i=null,s=Ee(this,s);let u=this.g.get(s);return u||this.g.set(s,u=[]),u.push(a),this.h+=1,this};function Di(s,a){oe(s),a=Ee(s,a),s.g.has(a)&&(s.i=null,s.h-=s.g.get(a).length,s.g.delete(a))}function Ni(s,a){return oe(s),a=Ee(s,a),s.g.has(a)}r.forEach=function(s,a){oe(this),this.g.forEach(function(u,h){u.forEach(function(I){s.call(a,I,h,this)},this)},this)};function xi(s,a){oe(s);let u=[];if(typeof a=="string")Ni(s,a)&&(u=u.concat(s.g.get(Ee(s,a))));else for(s=Array.from(s.g.values()),a=0;a<s.length;a++)u=u.concat(s[a]);return u}r.set=function(s,a){return oe(this),this.i=null,s=Ee(this,s),Ni(this,s)&&(this.h-=this.g.get(s).length),this.g.set(s,[a]),this.h+=1,this},r.get=function(s,a){return s?(s=xi(this,s),s.length>0?String(s[0]):a):a};function ki(s,a,u){Di(s,a),u.length>0&&(s.i=null,s.g.set(Ee(s,a),S(u)),s.h+=u.length)}r.toString=function(){if(this.i)return this.i;if(!this.g)return"";const s=[],a=Array.from(this.g.keys());for(let h=0;h<a.length;h++){var u=a[h];const I=He(u);u=xi(this,u);for(let A=0;A<u.length;A++){let b=I;u[A]!==""&&(b+="="+He(u[A])),s.push(b)}}return this.i=s.join("&")};function Oi(s){const a=new Ye;return a.i=s.i,s.g&&(a.g=new Map(s.g),a.h=s.h),a}function Ee(s,a){return a=String(a),s.j&&(a=a.toLowerCase()),a}function nu(s,a){a&&!s.j&&(oe(s),s.i=null,s.g.forEach(function(u,h){const I=h.toLowerCase();h!=I&&(Di(this,h),ki(this,I,u))},s)),s.j=a}function ru(s,a){const u=new ze;if(c.Image){const h=new Image;h.onload=_(jt,u,"TestLoadImage: loaded",!0,a,h),h.onerror=_(jt,u,"TestLoadImage: error",!1,a,h),h.onabort=_(jt,u,"TestLoadImage: abort",!1,a,h),h.ontimeout=_(jt,u,"TestLoadImage: timeout",!1,a,h),c.setTimeout(function(){h.ontimeout&&h.ontimeout()},1e4),h.src=s}else a(!1)}function su(s,a){const u=new ze,h=new AbortController,I=setTimeout(()=>{h.abort(),jt(u,"TestPingServer: timeout",!1,a)},1e4);fetch(s,{signal:h.signal}).then(A=>{clearTimeout(I),A.ok?jt(u,"TestPingServer: ok",!0,a):jt(u,"TestPingServer: server error",!1,a)}).catch(()=>{clearTimeout(I),jt(u,"TestPingServer: error",!1,a)})}function jt(s,a,u,h,I){try{I&&(I.onload=null,I.onerror=null,I.onabort=null,I.ontimeout=null),h(u)}catch{}}function iu(){this.g=new jc}function Or(s){this.i=s.Sb||null,this.h=s.ab||!1}v(Or,hi),Or.prototype.g=function(){return new xn(this.i,this.h)};function xn(s,a){pt.call(this),this.H=s,this.o=a,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.A=new Headers,this.h=null,this.F="GET",this.D="",this.g=!1,this.B=this.j=this.l=null,this.v=new AbortController}v(xn,pt),r=xn.prototype,r.open=function(s,a){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.F=s,this.D=a,this.readyState=1,Ze(this)},r.send=function(s){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");if(this.v.signal.aborted)throw this.abort(),Error("Request was aborted.");this.g=!0;const a={headers:this.A,method:this.F,credentials:this.m,cache:void 0,signal:this.v.signal};s&&(a.body=s),(this.H||c).fetch(new Request(this.D,a)).then(this.Pa.bind(this),this.ga.bind(this))},r.abort=function(){this.response=this.responseText="",this.A=new Headers,this.status=0,this.v.abort(),this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),this.readyState>=1&&this.g&&this.readyState!=4&&(this.g=!1,Je(this)),this.readyState=0},r.Pa=function(s){if(this.g&&(this.l=s,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=s.headers,this.readyState=2,Ze(this)),this.g&&(this.readyState=3,Ze(this),this.g)))if(this.responseType==="arraybuffer")s.arrayBuffer().then(this.Na.bind(this),this.ga.bind(this));else if(typeof c.ReadableStream<"u"&&"body"in s){if(this.j=s.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.B=new TextDecoder;Mi(this)}else s.text().then(this.Oa.bind(this),this.ga.bind(this))};function Mi(s){s.j.read().then(s.Ma.bind(s)).catch(s.ga.bind(s))}r.Ma=function(s){if(this.g){if(this.o&&s.value)this.response.push(s.value);else if(!this.o){var a=s.value?s.value:new Uint8Array(0);(a=this.B.decode(a,{stream:!s.done}))&&(this.response=this.responseText+=a)}s.done?Je(this):Ze(this),this.readyState==3&&Mi(this)}},r.Oa=function(s){this.g&&(this.response=this.responseText=s,Je(this))},r.Na=function(s){this.g&&(this.response=s,Je(this))},r.ga=function(){this.g&&Je(this)};function Je(s){s.readyState=4,s.l=null,s.j=null,s.B=null,Ze(s)}r.setRequestHeader=function(s,a){this.A.append(s,a)},r.getResponseHeader=function(s){return this.h&&this.h.get(s.toLowerCase())||""},r.getAllResponseHeaders=function(){if(!this.h)return"";const s=[],a=this.h.entries();for(var u=a.next();!u.done;)u=u.value,s.push(u[0]+": "+u[1]),u=a.next();return s.join(`\r
`)};function Ze(s){s.onreadystatechange&&s.onreadystatechange.call(s)}Object.defineProperty(xn.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(s){this.m=s?"include":"same-origin"}});function Li(s){let a="";return Cn(s,function(u,h){a+=h,a+=":",a+=u,a+=`\r
`}),a}function Mr(s,a,u){t:{for(h in u){var h=!1;break t}h=!0}h||(u=Li(u),typeof s=="string"?u!=null&&He(u):W(s,a,u))}function Z(s){pt.call(this),this.headers=new Map,this.L=s||null,this.h=!1,this.g=null,this.D="",this.o=0,this.l="",this.j=this.B=this.v=this.A=!1,this.m=null,this.F="",this.H=!1}v(Z,pt);var ou=/^https?$/i,au=["POST","PUT"];r=Z.prototype,r.Fa=function(s){this.H=s},r.ea=function(s,a,u,h){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+s);a=a?a.toUpperCase():"GET",this.D=s,this.l="",this.o=0,this.A=!1,this.h=!0,this.g=this.L?this.L.g():yi.g(),this.g.onreadystatechange=R(f(this.Ca,this));try{this.B=!0,this.g.open(a,String(s),!0),this.B=!1}catch(A){Fi(this,A);return}if(s=u||"",u=new Map(this.headers),h)if(Object.getPrototypeOf(h)===Object.prototype)for(var I in h)u.set(I,h[I]);else if(typeof h.keys=="function"&&typeof h.get=="function")for(const A of h.keys())u.set(A,h.get(A));else throw Error("Unknown input type for opt_headers: "+String(h));h=Array.from(u.keys()).find(A=>A.toLowerCase()=="content-type"),I=c.FormData&&s instanceof c.FormData,!(Array.prototype.indexOf.call(au,a,void 0)>=0)||h||I||u.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[A,b]of u)this.g.setRequestHeader(A,b);this.F&&(this.g.responseType=this.F),"withCredentials"in this.g&&this.g.withCredentials!==this.H&&(this.g.withCredentials=this.H);try{this.m&&(clearTimeout(this.m),this.m=null),this.v=!0,this.g.send(s),this.v=!1}catch(A){Fi(this,A)}};function Fi(s,a){s.h=!1,s.g&&(s.j=!0,s.g.abort(),s.j=!1),s.l=a,s.o=5,Ui(s),kn(s)}function Ui(s){s.A||(s.A=!0,Tt(s,"complete"),Tt(s,"error"))}r.abort=function(s){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.o=s||7,Tt(this,"complete"),Tt(this,"abort"),kn(this))},r.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),kn(this,!0)),Z.Z.N.call(this)},r.Ca=function(){this.u||(this.B||this.v||this.j?Bi(this):this.Xa())},r.Xa=function(){Bi(this)};function Bi(s){if(s.h&&typeof o<"u"){if(s.v&&qt(s)==4)setTimeout(s.Ca.bind(s),0);else if(Tt(s,"readystatechange"),qt(s)==4){s.h=!1;try{const A=s.ca();t:switch(A){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var a=!0;break t;default:a=!1}var u;if(!(u=a)){var h;if(h=A===0){let b=String(s.D).match(bi)[1]||null;!b&&c.self&&c.self.location&&(b=c.self.location.protocol.slice(0,-1)),h=!ou.test(b?b.toLowerCase():"")}u=h}if(u)Tt(s,"complete"),Tt(s,"success");else{s.o=6;try{var I=qt(s)>2?s.g.statusText:""}catch{I=""}s.l=I+" ["+s.ca()+"]",Ui(s)}}finally{kn(s)}}}}function kn(s,a){if(s.g){s.m&&(clearTimeout(s.m),s.m=null);const u=s.g;s.g=null,a||Tt(s,"ready");try{u.onreadystatechange=null}catch{}}}r.isActive=function(){return!!this.g};function qt(s){return s.g?s.g.readyState:0}r.ca=function(){try{return qt(this)>2?this.g.status:-1}catch{return-1}},r.la=function(){try{return this.g?this.g.responseText:""}catch{return""}},r.La=function(s){if(this.g){var a=this.g.responseText;return s&&a.indexOf(s)==0&&(a=a.substring(s.length)),Bc(a)}};function ji(s){try{if(!s.g)return null;if("response"in s.g)return s.g.response;switch(s.F){case"":case"text":return s.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in s.g)return s.g.mozResponseArrayBuffer}return null}catch{return null}}function cu(s){const a={};s=(s.g&&qt(s)>=2&&s.g.getAllResponseHeaders()||"").split(`\r
`);for(let h=0;h<s.length;h++){if(g(s[h]))continue;var u=Gc(s[h]);const I=u[0];if(u=u[1],typeof u!="string")continue;u=u.trim();const A=a[I]||[];a[I]=A,A.push(u)}kc(a,function(h){return h.join(", ")})}r.ya=function(){return this.o},r.Ha=function(){return typeof this.l=="string"?this.l:String(this.l)};function tn(s,a,u){return u&&u.internalChannelParams&&u.internalChannelParams[s]||a}function qi(s){this.za=0,this.i=[],this.j=new ze,this.ba=this.na=this.J=this.W=this.g=this.wa=this.G=this.H=this.u=this.U=this.o=null,this.Ya=this.V=0,this.Sa=tn("failFast",!1,s),this.F=this.C=this.v=this.m=this.l=null,this.X=!0,this.xa=this.K=-1,this.Y=this.A=this.D=0,this.Qa=tn("baseRetryDelayMs",5e3,s),this.Za=tn("retryDelaySeedMs",1e4,s),this.Ta=tn("forwardChannelMaxRetries",2,s),this.va=tn("forwardChannelRequestTimeoutMs",2e4,s),this.ma=s&&s.xmlHttpFactory||void 0,this.Ua=s&&s.Rb||void 0,this.Aa=s&&s.useFetchStreams||!1,this.O=void 0,this.L=s&&s.supportsCrossDomainXhr||!1,this.M="",this.h=new Ai(s&&s.concurrentRequestLimit),this.Ba=new iu,this.S=s&&s.fastHandshake||!1,this.R=s&&s.encodeInitMessageHeaders||!1,this.S&&this.R&&(this.R=!1),this.Ra=s&&s.Pb||!1,s&&s.ua&&this.j.ua(),s&&s.forceLongPolling&&(this.X=!1),this.aa=!this.S&&this.X&&s&&s.detectBufferingProxy||!1,this.ia=void 0,s&&s.longPollingTimeout&&s.longPollingTimeout>0&&(this.ia=s.longPollingTimeout),this.ta=void 0,this.T=0,this.P=!1,this.ja=this.B=null}r=qi.prototype,r.ka=8,r.I=1,r.connect=function(s,a,u,h){vt(0),this.W=s,this.H=a||{},u&&h!==void 0&&(this.H.OSID=u,this.H.OAID=h),this.F=this.X,this.J=Yi(this,null,this.W),Mn(this)};function Lr(s){if($i(s),s.I==3){var a=s.V++,u=Pt(s.J);if(W(u,"SID",s.M),W(u,"RID",a),W(u,"TYPE","terminate"),en(s,u),a=new Ut(s,s.j,a),a.M=2,a.A=Nn(Pt(u)),u=!1,c.navigator&&c.navigator.sendBeacon)try{u=c.navigator.sendBeacon(a.A.toString(),"")}catch{}!u&&c.Image&&(new Image().src=a.A,u=!0),u||(a.g=Ji(a.j,null),a.g.ea(a.A)),a.F=Date.now(),Dn(a)}Xi(s)}function On(s){s.g&&(Ur(s),s.g.cancel(),s.g=null)}function $i(s){On(s),s.v&&(c.clearTimeout(s.v),s.v=null),Ln(s),s.h.cancel(),s.m&&(typeof s.m=="number"&&c.clearTimeout(s.m),s.m=null)}function Mn(s){if(!Ri(s.h)&&!s.m){s.m=!0;var a=s.Ea;gt||m(),J||(gt(),J=!0),E.add(a,s),s.D=0}}function uu(s,a){return Ci(s.h)>=s.h.j-(s.m?1:0)?!1:s.m?(s.i=a.G.concat(s.i),!0):s.I==1||s.I==2||s.D>=(s.Sa?0:s.Ta)?!1:(s.m=$e(f(s.Ea,s,a),Wi(s,s.D)),s.D++,!0)}r.Ea=function(s){if(this.m)if(this.m=null,this.I==1){if(!s){this.V=Math.floor(Math.random()*1e5),s=this.V++;const I=new Ut(this,this.j,s);let A=this.o;if(this.U&&(A?(A=ei(A),ri(A,this.U)):A=this.U),this.u!==null||this.R||(I.J=A,A=null),this.S)t:{for(var a=0,u=0;u<this.i.length;u++){e:{var h=this.i[u];if("__data__"in h.map&&(h=h.map.__data__,typeof h=="string")){h=h.length;break e}h=void 0}if(h===void 0)break;if(a+=h,a>4096){a=u;break t}if(a===4096||u===this.i.length-1){a=u+1;break t}}a=1e3}else a=1e3;a=Hi(this,I,a),u=Pt(this.J),W(u,"RID",s),W(u,"CVER",22),this.G&&W(u,"X-HTTP-Session-Id",this.G),en(this,u),A&&(this.R?a="headers="+He(Li(A))+"&"+a:this.u&&Mr(u,this.u,A)),xr(this.h,I),this.Ra&&W(u,"TYPE","init"),this.S?(W(u,"$req",a),W(u,"SID","null"),I.U=!0,br(I,u,null)):br(I,u,a),this.I=2}}else this.I==3&&(s?zi(this,s):this.i.length==0||Ri(this.h)||zi(this))};function zi(s,a){var u;a?u=a.l:u=s.V++;const h=Pt(s.J);W(h,"SID",s.M),W(h,"RID",u),W(h,"AID",s.K),en(s,h),s.u&&s.o&&Mr(h,s.u,s.o),u=new Ut(s,s.j,u,s.D+1),s.u===null&&(u.J=s.o),a&&(s.i=a.G.concat(s.i)),a=Hi(s,u,1e3),u.H=Math.round(s.va*.5)+Math.round(s.va*.5*Math.random()),xr(s.h,u),br(u,h,a)}function en(s,a){s.H&&Cn(s.H,function(u,h){W(a,h,u)}),s.l&&Cn({},function(u,h){W(a,h,u)})}function Hi(s,a,u){u=Math.min(s.i.length,u);const h=s.l?f(s.l.Ka,s.l,s):null;t:{var I=s.i;let U=-1;for(;;){const ot=["count="+u];U==-1?u>0?(U=I[0].g,ot.push("ofs="+U)):U=0:ot.push("ofs="+U);let K=!0;for(let ht=0;ht<u;ht++){var A=I[ht].g;const bt=I[ht].map;if(A-=U,A<0)U=Math.max(0,I[ht].g-100),K=!1;else try{A="req"+A+"_"||"";try{var b=bt instanceof Map?bt:Object.entries(bt);for(const[ce,$t]of b){let zt=$t;l($t)&&(zt=Ar($t)),ot.push(A+ce+"="+encodeURIComponent(zt))}}catch(ce){throw ot.push(A+"type="+encodeURIComponent("_badmap")),ce}}catch{h&&h(bt)}}if(K){b=ot.join("&");break t}}b=void 0}return s=s.i.splice(0,u),a.G=s,b}function Gi(s){if(!s.g&&!s.v){s.Y=1;var a=s.Da;gt||m(),J||(gt(),J=!0),E.add(a,s),s.A=0}}function Fr(s){return s.g||s.v||s.A>=3?!1:(s.Y++,s.v=$e(f(s.Da,s),Wi(s,s.A)),s.A++,!0)}r.Da=function(){if(this.v=null,Ki(this),this.aa&&!(this.P||this.g==null||this.T<=0)){var s=4*this.T;this.j.info("BP detection timer enabled: "+s),this.B=$e(f(this.Wa,this),s)}},r.Wa=function(){this.B&&(this.B=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.P=!0,vt(10),On(this),Ki(this))};function Ur(s){s.B!=null&&(c.clearTimeout(s.B),s.B=null)}function Ki(s){s.g=new Ut(s,s.j,"rpc",s.Y),s.u===null&&(s.g.J=s.o),s.g.P=0;var a=Pt(s.na);W(a,"RID","rpc"),W(a,"SID",s.M),W(a,"AID",s.K),W(a,"CI",s.F?"0":"1"),!s.F&&s.ia&&W(a,"TO",s.ia),W(a,"TYPE","xmlhttp"),en(s,a),s.u&&s.o&&Mr(a,s.u,s.o),s.O&&(s.g.H=s.O);var u=s.g;s=s.ba,u.M=1,u.A=Nn(Pt(a)),u.u=null,u.R=!0,vi(u,s)}r.Va=function(){this.C!=null&&(this.C=null,On(this),Fr(this),vt(19))};function Ln(s){s.C!=null&&(c.clearTimeout(s.C),s.C=null)}function Qi(s,a){var u=null;if(s.g==a){Ln(s),Ur(s),s.g=null;var h=2}else if(Nr(s.h,a))u=a.G,Si(s.h,a),h=1;else return;if(s.I!=0){if(a.o)if(h==1){u=a.u?a.u.length:0,a=Date.now()-a.F;var I=s.D;h=bn(),Tt(h,new pi(h,u)),Mn(s)}else Gi(s);else if(I=a.m,I==3||I==0&&a.X>0||!(h==1&&uu(s,a)||h==2&&Fr(s)))switch(u&&u.length>0&&(a=s.h,a.i=a.i.concat(u)),I){case 1:ae(s,5);break;case 4:ae(s,10);break;case 3:ae(s,6);break;default:ae(s,2)}}}function Wi(s,a){let u=s.Qa+Math.floor(Math.random()*s.Za);return s.isActive()||(u*=2),u*a}function ae(s,a){if(s.j.info("Error code "+a),a==2){var u=f(s.bb,s),h=s.Ua;const I=!h;h=new Bt(h||"//www.google.com/images/cleardot.gif"),c.location&&c.location.protocol=="http"||Ke(h,"https"),Nn(h),I?ru(h.toString(),u):su(h.toString(),u)}else vt(2);s.I=0,s.l&&s.l.pa(a),Xi(s),$i(s)}r.bb=function(s){s?(this.j.info("Successfully pinged google.com"),vt(2)):(this.j.info("Failed to ping google.com"),vt(1))};function Xi(s){if(s.I=0,s.ja=[],s.l){const a=Pi(s.h);(a.length!=0||s.i.length!=0)&&(N(s.ja,a),N(s.ja,s.i),s.h.i.length=0,S(s.i),s.i.length=0),s.l.oa()}}function Yi(s,a,u){var h=u instanceof Bt?Pt(u):new Bt(u);if(h.g!="")a&&(h.g=a+"."+h.g),Qe(h,h.u);else{var I=c.location;h=I.protocol,a=a?a+"."+I.hostname:I.hostname,I=+I.port;const A=new Bt(null);h&&Ke(A,h),a&&(A.g=a),I&&Qe(A,I),u&&(A.h=u),h=A}return u=s.G,a=s.wa,u&&a&&W(h,u,a),W(h,"VER",s.ka),en(s,h),h}function Ji(s,a,u){if(a&&!s.L)throw Error("Can't create secondary domain capable XhrIo object.");return a=s.Aa&&!s.ma?new Z(new Or({ab:u})):new Z(s.ma),a.Fa(s.L),a}r.isActive=function(){return!!this.l&&this.l.isActive(this)};function Zi(){}r=Zi.prototype,r.ra=function(){},r.qa=function(){},r.pa=function(){},r.oa=function(){},r.isActive=function(){return!0},r.Ka=function(){};function Fn(){}Fn.prototype.g=function(s,a){return new Rt(s,a)};function Rt(s,a){pt.call(this),this.g=new qi(a),this.l=s,this.h=a&&a.messageUrlParams||null,s=a&&a.messageHeaders||null,a&&a.clientProtocolHeaderRequired&&(s?s["X-Client-Protocol"]="webchannel":s={"X-Client-Protocol":"webchannel"}),this.g.o=s,s=a&&a.initMessageHeaders||null,a&&a.messageContentType&&(s?s["X-WebChannel-Content-Type"]=a.messageContentType:s={"X-WebChannel-Content-Type":a.messageContentType}),a&&a.sa&&(s?s["X-WebChannel-Client-Profile"]=a.sa:s={"X-WebChannel-Client-Profile":a.sa}),this.g.U=s,(s=a&&a.Qb)&&!g(s)&&(this.g.u=s),this.A=a&&a.supportsCrossDomainXhr||!1,this.v=a&&a.sendRawJson||!1,(a=a&&a.httpSessionIdParam)&&!g(a)&&(this.g.G=a,s=this.h,s!==null&&a in s&&(s=this.h,a in s&&delete s[a])),this.j=new Te(this)}v(Rt,pt),Rt.prototype.m=function(){this.g.l=this.j,this.A&&(this.g.L=!0),this.g.connect(this.l,this.h||void 0)},Rt.prototype.close=function(){Lr(this.g)},Rt.prototype.o=function(s){var a=this.g;if(typeof s=="string"){var u={};u.__data__=s,s=u}else this.v&&(u={},u.__data__=Ar(s),s=u);a.i.push(new Wc(a.Ya++,s)),a.I==3&&Mn(a)},Rt.prototype.N=function(){this.g.l=null,delete this.j,Lr(this.g),delete this.g,Rt.Z.N.call(this)};function to(s){Rr.call(this),s.__headers__&&(this.headers=s.__headers__,this.statusCode=s.__status__,delete s.__headers__,delete s.__status__);var a=s.__sm__;if(a){t:{for(const u in a){s=u;break t}s=void 0}(this.i=s)&&(s=this.i,a=a!==null&&s in a?a[s]:void 0),this.data=a}else this.data=s}v(to,Rr);function eo(){Cr.call(this),this.status=1}v(eo,Cr);function Te(s){this.g=s}v(Te,Zi),Te.prototype.ra=function(){Tt(this.g,"a")},Te.prototype.qa=function(s){Tt(this.g,new to(s))},Te.prototype.pa=function(s){Tt(this.g,new eo)},Te.prototype.oa=function(){Tt(this.g,"b")},Fn.prototype.createWebChannel=Fn.prototype.g,Rt.prototype.send=Rt.prototype.o,Rt.prototype.open=Rt.prototype.m,Rt.prototype.close=Rt.prototype.close,Sa=function(){return new Fn},Ca=function(){return bn()},Ra=se,cs={jb:0,mb:1,nb:2,Hb:3,Mb:4,Jb:5,Kb:6,Ib:7,Gb:8,Lb:9,PROXY:10,NOPROXY:11,Eb:12,Ab:13,Bb:14,zb:15,Cb:16,Db:17,fb:18,eb:19,gb:20},Vn.NO_ERROR=0,Vn.TIMEOUT=8,Vn.HTTP_ERROR=6,Hn=Vn,_i.COMPLETE="complete",Aa=_i,di.EventType=je,je.OPEN="a",je.CLOSE="b",je.ERROR="c",je.MESSAGE="d",pt.prototype.listen=pt.prototype.J,nn=di,Z.prototype.listenOnce=Z.prototype.K,Z.prototype.getLastError=Z.prototype.Ha,Z.prototype.getLastErrorCode=Z.prototype.ya,Z.prototype.getStatus=Z.prototype.ca,Z.prototype.getResponseJson=Z.prototype.La,Z.prototype.getResponseText=Z.prototype.la,Z.prototype.send=Z.prototype.ea,Z.prototype.setWithCredentials=Z.prototype.Fa,wa=Z}).apply(typeof Bn<"u"?Bn:typeof self<"u"?self:typeof window<"u"?window:{});const po="@firebase/firestore",_o="4.9.2";/**
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
 */class yt{constructor(t){this.uid=t}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(t){return t.uid===this.uid}}yt.UNAUTHENTICATED=new yt(null),yt.GOOGLE_CREDENTIALS=new yt("google-credentials-uid"),yt.FIRST_PARTY=new yt("first-party-uid"),yt.MOCK_USER=new yt("mock-user");/**
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
 */let Le="12.3.0";/**
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
 */const ge=new pa("@firebase/firestore");function Ie(){return ge.logLevel}function V(r,...t){if(ge.logLevel<=q.DEBUG){const e=t.map(Vs);ge.debug(`Firestore (${Le}): ${r}`,...e)}}function Ft(r,...t){if(ge.logLevel<=q.ERROR){const e=t.map(Vs);ge.error(`Firestore (${Le}): ${r}`,...e)}}function be(r,...t){if(ge.logLevel<=q.WARN){const e=t.map(Vs);ge.warn(`Firestore (${Le}): ${r}`,...e)}}function Vs(r){if(typeof r=="string")return r;try{/**
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
*/return function(e){return JSON.stringify(e)}(r)}catch{return r}}/**
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
 */function F(r,t,e){let n="Unexpected state";typeof t=="string"?n=t:e=t,Pa(r,n,e)}function Pa(r,t,e){let n=`FIRESTORE (${Le}) INTERNAL ASSERTION FAILED: ${t} (ID: ${r.toString(16)})`;if(e!==void 0)try{n+=" CONTEXT: "+JSON.stringify(e)}catch{n+=" CONTEXT: "+e}throw Ft(n),new Error(n)}function Y(r,t,e,n){let i="Unexpected state";typeof e=="string"?i=e:n=e,r||Pa(t,i,n)}function $(r,t){return r}/**
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
 */const P={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class x extends Me{constructor(t,e){super(t,e),this.code=t,this.message=e,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
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
 */class he{constructor(){this.promise=new Promise((t,e)=>{this.resolve=t,this.reject=e})}}/**
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
 */class ba{constructor(t,e){this.user=e,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${t}`)}}class Xl{getToken(){return Promise.resolve(null)}invalidateToken(){}start(t,e){t.enqueueRetryable(()=>e(yt.UNAUTHENTICATED))}shutdown(){}}class Yl{constructor(t){this.token=t,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(t,e){this.changeListener=e,t.enqueueRetryable(()=>e(this.token.user))}shutdown(){this.changeListener=null}}class Jl{constructor(t){this.t=t,this.currentUser=yt.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(t,e){Y(this.o===void 0,42304);let n=this.i;const i=d=>this.i!==n?(n=this.i,e(d)):Promise.resolve();let o=new he;this.o=()=>{this.i++,this.currentUser=this.u(),o.resolve(),o=new he,t.enqueueRetryable(()=>i(this.currentUser))};const c=()=>{const d=o;t.enqueueRetryable(async()=>{await d.promise,await i(this.currentUser)})},l=d=>{V("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=d,this.o&&(this.auth.addAuthTokenListener(this.o),c())};this.t.onInit(d=>l(d)),setTimeout(()=>{if(!this.auth){const d=this.t.getImmediate({optional:!0});d?l(d):(V("FirebaseAuthCredentialsProvider","Auth not yet detected"),o.resolve(),o=new he)}},0),c()}getToken(){const t=this.i,e=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(e).then(n=>this.i!==t?(V("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):n?(Y(typeof n.accessToken=="string",31837,{l:n}),new ba(n.accessToken,this.currentUser)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){const t=this.auth&&this.auth.getUid();return Y(t===null||typeof t=="string",2055,{h:t}),new yt(t)}}class Zl{constructor(t,e,n){this.P=t,this.T=e,this.I=n,this.type="FirstParty",this.user=yt.FIRST_PARTY,this.A=new Map}R(){return this.I?this.I():null}get headers(){this.A.set("X-Goog-AuthUser",this.P);const t=this.R();return t&&this.A.set("Authorization",t),this.T&&this.A.set("X-Goog-Iam-Authorization-Token",this.T),this.A}}class th{constructor(t,e,n){this.P=t,this.T=e,this.I=n}getToken(){return Promise.resolve(new Zl(this.P,this.T,this.I))}start(t,e){t.enqueueRetryable(()=>e(yt.FIRST_PARTY))}shutdown(){}invalidateToken(){}}class yo{constructor(t){this.value=t,this.type="AppCheck",this.headers=new Map,t&&t.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class eh{constructor(t,e){this.V=e,this.forceRefresh=!1,this.appCheck=null,this.m=null,this.p=null,xl(t)&&t.settings.appCheckToken&&(this.p=t.settings.appCheckToken)}start(t,e){Y(this.o===void 0,3512);const n=o=>{o.error!=null&&V("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${o.error.message}`);const c=o.token!==this.m;return this.m=o.token,V("FirebaseAppCheckTokenProvider",`Received ${c?"new":"existing"} token.`),c?e(o.token):Promise.resolve()};this.o=o=>{t.enqueueRetryable(()=>n(o))};const i=o=>{V("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=o,this.o&&this.appCheck.addTokenListener(this.o)};this.V.onInit(o=>i(o)),setTimeout(()=>{if(!this.appCheck){const o=this.V.getImmediate({optional:!0});o?i(o):V("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}},0)}getToken(){if(this.p)return Promise.resolve(new yo(this.p));const t=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(t).then(e=>e?(Y(typeof e.token=="string",44558,{tokenResult:e}),this.m=e.token,new yo(e.token)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}/**
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
 */function nh(r){const t=typeof self<"u"&&(self.crypto||self.msCrypto),e=new Uint8Array(r);if(t&&typeof t.getRandomValues=="function")t.getRandomValues(e);else for(let n=0;n<r;n++)e[n]=Math.floor(256*Math.random());return e}/**
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
 */class Ds{static newId(){const t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",e=62*Math.floor(4.129032258064516);let n="";for(;n.length<20;){const i=nh(40);for(let o=0;o<i.length;++o)n.length<20&&i[o]<e&&(n+=t.charAt(i[o]%62))}return n}}function B(r,t){return r<t?-1:r>t?1:0}function us(r,t){const e=Math.min(r.length,t.length);for(let n=0;n<e;n++){const i=r.charAt(n),o=t.charAt(n);if(i!==o)return Hr(i)===Hr(o)?B(i,o):Hr(i)?1:-1}return B(r.length,t.length)}const rh=55296,sh=57343;function Hr(r){const t=r.charCodeAt(0);return t>=rh&&t<=sh}function Ve(r,t,e){return r.length===t.length&&r.every((n,i)=>e(n,t[i]))}/**
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
 */const Eo="__name__";class Vt{constructor(t,e,n){e===void 0?e=0:e>t.length&&F(637,{offset:e,range:t.length}),n===void 0?n=t.length-e:n>t.length-e&&F(1746,{length:n,range:t.length-e}),this.segments=t,this.offset=e,this.len=n}get length(){return this.len}isEqual(t){return Vt.comparator(this,t)===0}child(t){const e=this.segments.slice(this.offset,this.limit());return t instanceof Vt?t.forEach(n=>{e.push(n)}):e.push(t),this.construct(e)}limit(){return this.offset+this.length}popFirst(t){return t=t===void 0?1:t,this.construct(this.segments,this.offset+t,this.length-t)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(t){return this.segments[this.offset+t]}isEmpty(){return this.length===0}isPrefixOf(t){if(t.length<this.length)return!1;for(let e=0;e<this.length;e++)if(this.get(e)!==t.get(e))return!1;return!0}isImmediateParentOf(t){if(this.length+1!==t.length)return!1;for(let e=0;e<this.length;e++)if(this.get(e)!==t.get(e))return!1;return!0}forEach(t){for(let e=this.offset,n=this.limit();e<n;e++)t(this.segments[e])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(t,e){const n=Math.min(t.length,e.length);for(let i=0;i<n;i++){const o=Vt.compareSegments(t.get(i),e.get(i));if(o!==0)return o}return B(t.length,e.length)}static compareSegments(t,e){const n=Vt.isNumericId(t),i=Vt.isNumericId(e);return n&&!i?-1:!n&&i?1:n&&i?Vt.extractNumericId(t).compare(Vt.extractNumericId(e)):us(t,e)}static isNumericId(t){return t.startsWith("__id")&&t.endsWith("__")}static extractNumericId(t){return Wt.fromString(t.substring(4,t.length-2))}}class X extends Vt{construct(t,e,n){return new X(t,e,n)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...t){const e=[];for(const n of t){if(n.indexOf("//")>=0)throw new x(P.INVALID_ARGUMENT,`Invalid segment (${n}). Paths must not contain // in them.`);e.push(...n.split("/").filter(i=>i.length>0))}return new X(e)}static emptyPath(){return new X([])}}const ih=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class It extends Vt{construct(t,e,n){return new It(t,e,n)}static isValidIdentifier(t){return ih.test(t)}canonicalString(){return this.toArray().map(t=>(t=t.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),It.isValidIdentifier(t)||(t="`"+t+"`"),t)).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===Eo}static keyField(){return new It([Eo])}static fromServerFormat(t){const e=[];let n="",i=0;const o=()=>{if(n.length===0)throw new x(P.INVALID_ARGUMENT,`Invalid field path (${t}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);e.push(n),n=""};let c=!1;for(;i<t.length;){const l=t[i];if(l==="\\"){if(i+1===t.length)throw new x(P.INVALID_ARGUMENT,"Path has trailing escape character: "+t);const d=t[i+1];if(d!=="\\"&&d!=="."&&d!=="`")throw new x(P.INVALID_ARGUMENT,"Path has invalid escape sequence: "+t);n+=d,i+=2}else l==="`"?(c=!c,i++):l!=="."||c?(n+=l,i++):(o(),i++)}if(o(),c)throw new x(P.INVALID_ARGUMENT,"Unterminated ` in path: "+t);return new It(e)}static emptyPath(){return new It([])}}/**
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
 */class O{constructor(t){this.path=t}static fromPath(t){return new O(X.fromString(t))}static fromName(t){return new O(X.fromString(t).popFirst(5))}static empty(){return new O(X.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(t){return this.path.length>=2&&this.path.get(this.path.length-2)===t}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(t){return t!==null&&X.comparator(this.path,t.path)===0}toString(){return this.path.toString()}static comparator(t,e){return X.comparator(t.path,e.path)}static isDocumentKey(t){return t.length%2==0}static fromSegments(t){return new O(new X(t.slice()))}}/**
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
 */function oh(r,t,e){if(!e)throw new x(P.INVALID_ARGUMENT,`Function ${r}() cannot be called with an empty ${t}.`)}function ah(r,t,e,n){if(t===!0&&n===!0)throw new x(P.INVALID_ARGUMENT,`${r} and ${e} cannot be used together.`)}function To(r){if(!O.isDocumentKey(r))throw new x(P.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${r} has ${r.length}.`)}function ch(r){return typeof r=="object"&&r!==null&&(Object.getPrototypeOf(r)===Object.prototype||Object.getPrototypeOf(r)===null)}function uh(r){if(r===void 0)return"undefined";if(r===null)return"null";if(typeof r=="string")return r.length>20&&(r=`${r.substring(0,20)}...`),JSON.stringify(r);if(typeof r=="number"||typeof r=="boolean")return""+r;if(typeof r=="object"){if(r instanceof Array)return"an array";{const t=function(n){return n.constructor?n.constructor.name:null}(r);return t?`a custom ${t} object`:"an object"}}return typeof r=="function"?"a function":F(12329,{type:typeof r})}function ls(r,t){if("_delegate"in r&&(r=r._delegate),!(r instanceof t)){if(t.name===r.constructor.name)throw new x(P.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const e=uh(r);throw new x(P.INVALID_ARGUMENT,`Expected type '${t.name}', but it was: ${e}`)}}return r}/**
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
 */function it(r,t){const e={typeString:r};return t&&(e.value=t),e}function vn(r,t){if(!ch(r))throw new x(P.INVALID_ARGUMENT,"JSON must be an object");let e;for(const n in t)if(t[n]){const i=t[n].typeString,o="value"in t[n]?{value:t[n].value}:void 0;if(!(n in r)){e=`JSON missing required field: '${n}'`;break}const c=r[n];if(i&&typeof c!==i){e=`JSON field '${n}' must be a ${i}.`;break}if(o!==void 0&&c!==o.value){e=`Expected '${n}' field to equal '${o.value}'`;break}}if(e)throw new x(P.INVALID_ARGUMENT,e);return!0}/**
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
 */const vo=-62135596800,Io=1e6;class st{static now(){return st.fromMillis(Date.now())}static fromDate(t){return st.fromMillis(t.getTime())}static fromMillis(t){const e=Math.floor(t/1e3),n=Math.floor((t-1e3*e)*Io);return new st(e,n)}constructor(t,e){if(this.seconds=t,this.nanoseconds=e,e<0)throw new x(P.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+e);if(e>=1e9)throw new x(P.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+e);if(t<vo)throw new x(P.INVALID_ARGUMENT,"Timestamp seconds out of range: "+t);if(t>=253402300800)throw new x(P.INVALID_ARGUMENT,"Timestamp seconds out of range: "+t)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/Io}_compareTo(t){return this.seconds===t.seconds?B(this.nanoseconds,t.nanoseconds):B(this.seconds,t.seconds)}isEqual(t){return t.seconds===this.seconds&&t.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:st._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(t){if(vn(t,st._jsonSchema))return new st(t.seconds,t.nanoseconds)}valueOf(){const t=this.seconds-vo;return String(t).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}st._jsonSchemaVersion="firestore/timestamp/1.0",st._jsonSchema={type:it("string",st._jsonSchemaVersion),seconds:it("number"),nanoseconds:it("number")};/**
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
 */class L{static fromTimestamp(t){return new L(t)}static min(){return new L(new st(0,0))}static max(){return new L(new st(253402300799,999999999))}constructor(t){this.timestamp=t}compareTo(t){return this.timestamp._compareTo(t.timestamp)}isEqual(t){return this.timestamp.isEqual(t.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}/**
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
 */const pn=-1;function lh(r,t){const e=r.toTimestamp().seconds,n=r.toTimestamp().nanoseconds+1,i=L.fromTimestamp(n===1e9?new st(e+1,0):new st(e,n));return new Jt(i,O.empty(),t)}function hh(r){return new Jt(r.readTime,r.key,pn)}class Jt{constructor(t,e,n){this.readTime=t,this.documentKey=e,this.largestBatchId=n}static min(){return new Jt(L.min(),O.empty(),pn)}static max(){return new Jt(L.max(),O.empty(),pn)}}function dh(r,t){let e=r.readTime.compareTo(t.readTime);return e!==0?e:(e=O.comparator(r.documentKey,t.documentKey),e!==0?e:B(r.largestBatchId,t.largestBatchId))}/**
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
 */const fh="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";class mh{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(t){this.onCommittedListeners.push(t)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach(t=>t())}}/**
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
 */async function or(r){if(r.code!==P.FAILED_PRECONDITION||r.message!==fh)throw r;V("LocalStore","Unexpectedly lost primary lease")}/**
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
 */class C{constructor(t){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,t(e=>{this.isDone=!0,this.result=e,this.nextCallback&&this.nextCallback(e)},e=>{this.isDone=!0,this.error=e,this.catchCallback&&this.catchCallback(e)})}catch(t){return this.next(void 0,t)}next(t,e){return this.callbackAttached&&F(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(e,this.error):this.wrapSuccess(t,this.result):new C((n,i)=>{this.nextCallback=o=>{this.wrapSuccess(t,o).next(n,i)},this.catchCallback=o=>{this.wrapFailure(e,o).next(n,i)}})}toPromise(){return new Promise((t,e)=>{this.next(t,e)})}wrapUserFunction(t){try{const e=t();return e instanceof C?e:C.resolve(e)}catch(e){return C.reject(e)}}wrapSuccess(t,e){return t?this.wrapUserFunction(()=>t(e)):C.resolve(e)}wrapFailure(t,e){return t?this.wrapUserFunction(()=>t(e)):C.reject(e)}static resolve(t){return new C((e,n)=>{e(t)})}static reject(t){return new C((e,n)=>{n(t)})}static waitFor(t){return new C((e,n)=>{let i=0,o=0,c=!1;t.forEach(l=>{++i,l.next(()=>{++o,c&&o===i&&e()},d=>n(d))}),c=!0,o===i&&e()})}static or(t){let e=C.resolve(!1);for(const n of t)e=e.next(i=>i?C.resolve(i):n());return e}static forEach(t,e){const n=[];return t.forEach((i,o)=>{n.push(e.call(this,i,o))}),this.waitFor(n)}static mapArray(t,e){return new C((n,i)=>{const o=t.length,c=new Array(o);let l=0;for(let d=0;d<o;d++){const f=d;e(t[f]).next(_=>{c[f]=_,++l,l===o&&n(c)},_=>i(_))}})}static doWhile(t,e){return new C((n,i)=>{const o=()=>{t()===!0?e().next(()=>{o()},i):n()};o()})}}function gh(r){const t=r.match(/Android ([\d.]+)/i),e=t?t[1].split(".").slice(0,2).join("."):"-1";return Number(e)}function Fe(r){return r.name==="IndexedDbTransactionError"}/**
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
 */class ar{constructor(t,e){this.previousValue=t,e&&(e.sequenceNumberHandler=n=>this.ae(n),this.ue=n=>e.writeSequenceNumber(n))}ae(t){return this.previousValue=Math.max(t,this.previousValue),this.previousValue}next(){const t=++this.previousValue;return this.ue&&this.ue(t),t}}ar.ce=-1;/**
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
 */const ph=-1;function cr(r){return r==null}function hs(r){return r===0&&1/r==-1/0}/**
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
 */const Va="";function _h(r){let t="";for(let e=0;e<r.length;e++)t.length>0&&(t=wo(t)),t=yh(r.get(e),t);return wo(t)}function yh(r,t){let e=t;const n=r.length;for(let i=0;i<n;i++){const o=r.charAt(i);switch(o){case"\0":e+="";break;case Va:e+="";break;default:e+=o}}return e}function wo(r){return r+Va+""}/**
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
 */function Ao(r){let t=0;for(const e in r)Object.prototype.hasOwnProperty.call(r,e)&&t++;return t}function In(r,t){for(const e in r)Object.prototype.hasOwnProperty.call(r,e)&&t(e,r[e])}function Eh(r){for(const t in r)if(Object.prototype.hasOwnProperty.call(r,t))return!1;return!0}/**
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
 */class nt{constructor(t,e){this.comparator=t,this.root=e||ft.EMPTY}insert(t,e){return new nt(this.comparator,this.root.insert(t,e,this.comparator).copy(null,null,ft.BLACK,null,null))}remove(t){return new nt(this.comparator,this.root.remove(t,this.comparator).copy(null,null,ft.BLACK,null,null))}get(t){let e=this.root;for(;!e.isEmpty();){const n=this.comparator(t,e.key);if(n===0)return e.value;n<0?e=e.left:n>0&&(e=e.right)}return null}indexOf(t){let e=0,n=this.root;for(;!n.isEmpty();){const i=this.comparator(t,n.key);if(i===0)return e+n.left.size;i<0?n=n.left:(e+=n.left.size+1,n=n.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(t){return this.root.inorderTraversal(t)}forEach(t){this.inorderTraversal((e,n)=>(t(e,n),!1))}toString(){const t=[];return this.inorderTraversal((e,n)=>(t.push(`${e}:${n}`),!1)),`{${t.join(", ")}}`}reverseTraversal(t){return this.root.reverseTraversal(t)}getIterator(){return new jn(this.root,null,this.comparator,!1)}getIteratorFrom(t){return new jn(this.root,t,this.comparator,!1)}getReverseIterator(){return new jn(this.root,null,this.comparator,!0)}getReverseIteratorFrom(t){return new jn(this.root,t,this.comparator,!0)}}class jn{constructor(t,e,n,i){this.isReverse=i,this.nodeStack=[];let o=1;for(;!t.isEmpty();)if(o=e?n(t.key,e):1,e&&i&&(o*=-1),o<0)t=this.isReverse?t.left:t.right;else{if(o===0){this.nodeStack.push(t);break}this.nodeStack.push(t),t=this.isReverse?t.right:t.left}}getNext(){let t=this.nodeStack.pop();const e={key:t.key,value:t.value};if(this.isReverse)for(t=t.left;!t.isEmpty();)this.nodeStack.push(t),t=t.right;else for(t=t.right;!t.isEmpty();)this.nodeStack.push(t),t=t.left;return e}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;const t=this.nodeStack[this.nodeStack.length-1];return{key:t.key,value:t.value}}}class ft{constructor(t,e,n,i,o){this.key=t,this.value=e,this.color=n??ft.RED,this.left=i??ft.EMPTY,this.right=o??ft.EMPTY,this.size=this.left.size+1+this.right.size}copy(t,e,n,i,o){return new ft(t??this.key,e??this.value,n??this.color,i??this.left,o??this.right)}isEmpty(){return!1}inorderTraversal(t){return this.left.inorderTraversal(t)||t(this.key,this.value)||this.right.inorderTraversal(t)}reverseTraversal(t){return this.right.reverseTraversal(t)||t(this.key,this.value)||this.left.reverseTraversal(t)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(t,e,n){let i=this;const o=n(t,i.key);return i=o<0?i.copy(null,null,null,i.left.insert(t,e,n),null):o===0?i.copy(null,e,null,null,null):i.copy(null,null,null,null,i.right.insert(t,e,n)),i.fixUp()}removeMin(){if(this.left.isEmpty())return ft.EMPTY;let t=this;return t.left.isRed()||t.left.left.isRed()||(t=t.moveRedLeft()),t=t.copy(null,null,null,t.left.removeMin(),null),t.fixUp()}remove(t,e){let n,i=this;if(e(t,i.key)<0)i.left.isEmpty()||i.left.isRed()||i.left.left.isRed()||(i=i.moveRedLeft()),i=i.copy(null,null,null,i.left.remove(t,e),null);else{if(i.left.isRed()&&(i=i.rotateRight()),i.right.isEmpty()||i.right.isRed()||i.right.left.isRed()||(i=i.moveRedRight()),e(t,i.key)===0){if(i.right.isEmpty())return ft.EMPTY;n=i.right.min(),i=i.copy(n.key,n.value,null,null,i.right.removeMin())}i=i.copy(null,null,null,null,i.right.remove(t,e))}return i.fixUp()}isRed(){return this.color}fixUp(){let t=this;return t.right.isRed()&&!t.left.isRed()&&(t=t.rotateLeft()),t.left.isRed()&&t.left.left.isRed()&&(t=t.rotateRight()),t.left.isRed()&&t.right.isRed()&&(t=t.colorFlip()),t}moveRedLeft(){let t=this.colorFlip();return t.right.left.isRed()&&(t=t.copy(null,null,null,null,t.right.rotateRight()),t=t.rotateLeft(),t=t.colorFlip()),t}moveRedRight(){let t=this.colorFlip();return t.left.left.isRed()&&(t=t.rotateRight(),t=t.colorFlip()),t}rotateLeft(){const t=this.copy(null,null,ft.RED,null,this.right.left);return this.right.copy(null,null,this.color,t,null)}rotateRight(){const t=this.copy(null,null,ft.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,t)}colorFlip(){const t=this.left.copy(null,null,!this.left.color,null,null),e=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,t,e)}checkMaxDepth(){const t=this.check();return Math.pow(2,t)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw F(43730,{key:this.key,value:this.value});if(this.right.isRed())throw F(14113,{key:this.key,value:this.value});const t=this.left.check();if(t!==this.right.check())throw F(27949);return t+(this.isRed()?0:1)}}ft.EMPTY=null,ft.RED=!0,ft.BLACK=!1;ft.EMPTY=new class{constructor(){this.size=0}get key(){throw F(57766)}get value(){throw F(16141)}get color(){throw F(16727)}get left(){throw F(29726)}get right(){throw F(36894)}copy(t,e,n,i,o){return this}insert(t,e,n){return new ft(t,e)}remove(t,e){return this}isEmpty(){return!0}inorderTraversal(t){return!1}reverseTraversal(t){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
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
 */class ct{constructor(t){this.comparator=t,this.data=new nt(this.comparator)}has(t){return this.data.get(t)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(t){return this.data.indexOf(t)}forEach(t){this.data.inorderTraversal((e,n)=>(t(e),!1))}forEachInRange(t,e){const n=this.data.getIteratorFrom(t[0]);for(;n.hasNext();){const i=n.getNext();if(this.comparator(i.key,t[1])>=0)return;e(i.key)}}forEachWhile(t,e){let n;for(n=e!==void 0?this.data.getIteratorFrom(e):this.data.getIterator();n.hasNext();)if(!t(n.getNext().key))return}firstAfterOrEqual(t){const e=this.data.getIteratorFrom(t);return e.hasNext()?e.getNext().key:null}getIterator(){return new Ro(this.data.getIterator())}getIteratorFrom(t){return new Ro(this.data.getIteratorFrom(t))}add(t){return this.copy(this.data.remove(t).insert(t,!0))}delete(t){return this.has(t)?this.copy(this.data.remove(t)):this}isEmpty(){return this.data.isEmpty()}unionWith(t){let e=this;return e.size<t.size&&(e=t,t=this),t.forEach(n=>{e=e.add(n)}),e}isEqual(t){if(!(t instanceof ct)||this.size!==t.size)return!1;const e=this.data.getIterator(),n=t.data.getIterator();for(;e.hasNext();){const i=e.getNext().key,o=n.getNext().key;if(this.comparator(i,o)!==0)return!1}return!0}toArray(){const t=[];return this.forEach(e=>{t.push(e)}),t}toString(){const t=[];return this.forEach(e=>t.push(e)),"SortedSet("+t.toString()+")"}copy(t){const e=new ct(this.comparator);return e.data=t,e}}class Ro{constructor(t){this.iter=t}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}/**
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
 */class Ht{constructor(t){this.fields=t,t.sort(It.comparator)}static empty(){return new Ht([])}unionWith(t){let e=new ct(It.comparator);for(const n of this.fields)e=e.add(n);for(const n of t)e=e.add(n);return new Ht(e.toArray())}covers(t){for(const e of this.fields)if(e.isPrefixOf(t))return!0;return!1}isEqual(t){return Ve(this.fields,t.fields,(e,n)=>e.isEqual(n))}}/**
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
 */class Da extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
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
 */class mt{constructor(t){this.binaryString=t}static fromBase64String(t){const e=function(i){try{return atob(i)}catch(o){throw typeof DOMException<"u"&&o instanceof DOMException?new Da("Invalid base64 string: "+o):o}}(t);return new mt(e)}static fromUint8Array(t){const e=function(i){let o="";for(let c=0;c<i.length;++c)o+=String.fromCharCode(i[c]);return o}(t);return new mt(e)}[Symbol.iterator](){let t=0;return{next:()=>t<this.binaryString.length?{value:this.binaryString.charCodeAt(t++),done:!1}:{value:void 0,done:!0}}}toBase64(){return function(e){return btoa(e)}(this.binaryString)}toUint8Array(){return function(e){const n=new Uint8Array(e.length);for(let i=0;i<e.length;i++)n[i]=e.charCodeAt(i);return n}(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(t){return B(this.binaryString,t.binaryString)}isEqual(t){return this.binaryString===t.binaryString}}mt.EMPTY_BYTE_STRING=new mt("");const Th=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function Zt(r){if(Y(!!r,39018),typeof r=="string"){let t=0;const e=Th.exec(r);if(Y(!!e,46558,{timestamp:r}),e[1]){let i=e[1];i=(i+"000000000").substr(0,9),t=Number(i)}const n=new Date(r);return{seconds:Math.floor(n.getTime()/1e3),nanos:t}}return{seconds:et(r.seconds),nanos:et(r.nanos)}}function et(r){return typeof r=="number"?r:typeof r=="string"?Number(r):0}function te(r){return typeof r=="string"?mt.fromBase64String(r):mt.fromUint8Array(r)}/**
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
 */const Na="server_timestamp",xa="__type__",ka="__previous_value__",Oa="__local_write_time__";function Ns(r){var e,n;return((n=(((e=r==null?void 0:r.mapValue)==null?void 0:e.fields)||{})[xa])==null?void 0:n.stringValue)===Na}function ur(r){const t=r.mapValue.fields[ka];return Ns(t)?ur(t):t}function _n(r){const t=Zt(r.mapValue.fields[Oa].timestampValue);return new st(t.seconds,t.nanos)}/**
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
 */class vh{constructor(t,e,n,i,o,c,l,d,f,_){this.databaseId=t,this.appId=e,this.persistenceKey=n,this.host=i,this.ssl=o,this.forceLongPolling=c,this.autoDetectLongPolling=l,this.longPollingOptions=d,this.useFetchStreams=f,this.isUsingEmulator=_}}const Zn="(default)";class yn{constructor(t,e){this.projectId=t,this.database=e||Zn}static empty(){return new yn("","")}get isDefaultDatabase(){return this.database===Zn}isEqual(t){return t instanceof yn&&t.projectId===this.projectId&&t.database===this.database}}/**
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
 */const Ih="__type__",wh="__max__",qn={mapValue:{}},Ah="__vector__",ds="value";function ee(r){return"nullValue"in r?0:"booleanValue"in r?1:"integerValue"in r||"doubleValue"in r?2:"timestampValue"in r?3:"stringValue"in r?5:"bytesValue"in r?6:"referenceValue"in r?7:"geoPointValue"in r?8:"arrayValue"in r?9:"mapValue"in r?Ns(r)?4:Ch(r)?9007199254740991:Rh(r)?10:11:F(28295,{value:r})}function kt(r,t){if(r===t)return!0;const e=ee(r);if(e!==ee(t))return!1;switch(e){case 0:case 9007199254740991:return!0;case 1:return r.booleanValue===t.booleanValue;case 4:return _n(r).isEqual(_n(t));case 3:return function(i,o){if(typeof i.timestampValue=="string"&&typeof o.timestampValue=="string"&&i.timestampValue.length===o.timestampValue.length)return i.timestampValue===o.timestampValue;const c=Zt(i.timestampValue),l=Zt(o.timestampValue);return c.seconds===l.seconds&&c.nanos===l.nanos}(r,t);case 5:return r.stringValue===t.stringValue;case 6:return function(i,o){return te(i.bytesValue).isEqual(te(o.bytesValue))}(r,t);case 7:return r.referenceValue===t.referenceValue;case 8:return function(i,o){return et(i.geoPointValue.latitude)===et(o.geoPointValue.latitude)&&et(i.geoPointValue.longitude)===et(o.geoPointValue.longitude)}(r,t);case 2:return function(i,o){if("integerValue"in i&&"integerValue"in o)return et(i.integerValue)===et(o.integerValue);if("doubleValue"in i&&"doubleValue"in o){const c=et(i.doubleValue),l=et(o.doubleValue);return c===l?hs(c)===hs(l):isNaN(c)&&isNaN(l)}return!1}(r,t);case 9:return Ve(r.arrayValue.values||[],t.arrayValue.values||[],kt);case 10:case 11:return function(i,o){const c=i.mapValue.fields||{},l=o.mapValue.fields||{};if(Ao(c)!==Ao(l))return!1;for(const d in c)if(c.hasOwnProperty(d)&&(l[d]===void 0||!kt(c[d],l[d])))return!1;return!0}(r,t);default:return F(52216,{left:r})}}function En(r,t){return(r.values||[]).find(e=>kt(e,t))!==void 0}function De(r,t){if(r===t)return 0;const e=ee(r),n=ee(t);if(e!==n)return B(e,n);switch(e){case 0:case 9007199254740991:return 0;case 1:return B(r.booleanValue,t.booleanValue);case 2:return function(o,c){const l=et(o.integerValue||o.doubleValue),d=et(c.integerValue||c.doubleValue);return l<d?-1:l>d?1:l===d?0:isNaN(l)?isNaN(d)?0:-1:1}(r,t);case 3:return Co(r.timestampValue,t.timestampValue);case 4:return Co(_n(r),_n(t));case 5:return us(r.stringValue,t.stringValue);case 6:return function(o,c){const l=te(o),d=te(c);return l.compareTo(d)}(r.bytesValue,t.bytesValue);case 7:return function(o,c){const l=o.split("/"),d=c.split("/");for(let f=0;f<l.length&&f<d.length;f++){const _=B(l[f],d[f]);if(_!==0)return _}return B(l.length,d.length)}(r.referenceValue,t.referenceValue);case 8:return function(o,c){const l=B(et(o.latitude),et(c.latitude));return l!==0?l:B(et(o.longitude),et(c.longitude))}(r.geoPointValue,t.geoPointValue);case 9:return So(r.arrayValue,t.arrayValue);case 10:return function(o,c){var R,S,N,M;const l=o.fields||{},d=c.fields||{},f=(R=l[ds])==null?void 0:R.arrayValue,_=(S=d[ds])==null?void 0:S.arrayValue,v=B(((N=f==null?void 0:f.values)==null?void 0:N.length)||0,((M=_==null?void 0:_.values)==null?void 0:M.length)||0);return v!==0?v:So(f,_)}(r.mapValue,t.mapValue);case 11:return function(o,c){if(o===qn.mapValue&&c===qn.mapValue)return 0;if(o===qn.mapValue)return 1;if(c===qn.mapValue)return-1;const l=o.fields||{},d=Object.keys(l),f=c.fields||{},_=Object.keys(f);d.sort(),_.sort();for(let v=0;v<d.length&&v<_.length;++v){const R=us(d[v],_[v]);if(R!==0)return R;const S=De(l[d[v]],f[_[v]]);if(S!==0)return S}return B(d.length,_.length)}(r.mapValue,t.mapValue);default:throw F(23264,{he:e})}}function Co(r,t){if(typeof r=="string"&&typeof t=="string"&&r.length===t.length)return B(r,t);const e=Zt(r),n=Zt(t),i=B(e.seconds,n.seconds);return i!==0?i:B(e.nanos,n.nanos)}function So(r,t){const e=r.values||[],n=t.values||[];for(let i=0;i<e.length&&i<n.length;++i){const o=De(e[i],n[i]);if(o)return o}return B(e.length,n.length)}function Ne(r){return fs(r)}function fs(r){return"nullValue"in r?"null":"booleanValue"in r?""+r.booleanValue:"integerValue"in r?""+r.integerValue:"doubleValue"in r?""+r.doubleValue:"timestampValue"in r?function(e){const n=Zt(e);return`time(${n.seconds},${n.nanos})`}(r.timestampValue):"stringValue"in r?r.stringValue:"bytesValue"in r?function(e){return te(e).toBase64()}(r.bytesValue):"referenceValue"in r?function(e){return O.fromName(e).toString()}(r.referenceValue):"geoPointValue"in r?function(e){return`geo(${e.latitude},${e.longitude})`}(r.geoPointValue):"arrayValue"in r?function(e){let n="[",i=!0;for(const o of e.values||[])i?i=!1:n+=",",n+=fs(o);return n+"]"}(r.arrayValue):"mapValue"in r?function(e){const n=Object.keys(e.fields||{}).sort();let i="{",o=!0;for(const c of n)o?o=!1:i+=",",i+=`${c}:${fs(e.fields[c])}`;return i+"}"}(r.mapValue):F(61005,{value:r})}function Gn(r){switch(ee(r)){case 0:case 1:return 4;case 2:return 8;case 3:case 8:return 16;case 4:const t=ur(r);return t?16+Gn(t):16;case 5:return 2*r.stringValue.length;case 6:return te(r.bytesValue).approximateByteSize();case 7:return r.referenceValue.length;case 9:return function(n){return(n.values||[]).reduce((i,o)=>i+Gn(o),0)}(r.arrayValue);case 10:case 11:return function(n){let i=0;return In(n.fields,(o,c)=>{i+=o.length+Gn(c)}),i}(r.mapValue);default:throw F(13486,{value:r})}}function ms(r){return!!r&&"integerValue"in r}function xs(r){return!!r&&"arrayValue"in r}function Po(r){return!!r&&"nullValue"in r}function bo(r){return!!r&&"doubleValue"in r&&isNaN(Number(r.doubleValue))}function Gr(r){return!!r&&"mapValue"in r}function Rh(r){var e,n;return((n=(((e=r==null?void 0:r.mapValue)==null?void 0:e.fields)||{})[Ih])==null?void 0:n.stringValue)===Ah}function cn(r){if(r.geoPointValue)return{geoPointValue:{...r.geoPointValue}};if(r.timestampValue&&typeof r.timestampValue=="object")return{timestampValue:{...r.timestampValue}};if(r.mapValue){const t={mapValue:{fields:{}}};return In(r.mapValue.fields,(e,n)=>t.mapValue.fields[e]=cn(n)),t}if(r.arrayValue){const t={arrayValue:{values:[]}};for(let e=0;e<(r.arrayValue.values||[]).length;++e)t.arrayValue.values[e]=cn(r.arrayValue.values[e]);return t}return{...r}}function Ch(r){return(((r.mapValue||{}).fields||{}).__type__||{}).stringValue===wh}/**
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
 */class Dt{constructor(t){this.value=t}static empty(){return new Dt({mapValue:{}})}field(t){if(t.isEmpty())return this.value;{let e=this.value;for(let n=0;n<t.length-1;++n)if(e=(e.mapValue.fields||{})[t.get(n)],!Gr(e))return null;return e=(e.mapValue.fields||{})[t.lastSegment()],e||null}}set(t,e){this.getFieldsMap(t.popLast())[t.lastSegment()]=cn(e)}setAll(t){let e=It.emptyPath(),n={},i=[];t.forEach((c,l)=>{if(!e.isImmediateParentOf(l)){const d=this.getFieldsMap(e);this.applyChanges(d,n,i),n={},i=[],e=l.popLast()}c?n[l.lastSegment()]=cn(c):i.push(l.lastSegment())});const o=this.getFieldsMap(e);this.applyChanges(o,n,i)}delete(t){const e=this.field(t.popLast());Gr(e)&&e.mapValue.fields&&delete e.mapValue.fields[t.lastSegment()]}isEqual(t){return kt(this.value,t.value)}getFieldsMap(t){let e=this.value;e.mapValue.fields||(e.mapValue={fields:{}});for(let n=0;n<t.length;++n){let i=e.mapValue.fields[t.get(n)];Gr(i)&&i.mapValue.fields||(i={mapValue:{fields:{}}},e.mapValue.fields[t.get(n)]=i),e=i}return e.mapValue.fields}applyChanges(t,e,n){In(e,(i,o)=>t[i]=o);for(const i of n)delete t[i]}clone(){return new Dt(cn(this.value))}}/**
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
 */class Et{constructor(t,e,n,i,o,c,l){this.key=t,this.documentType=e,this.version=n,this.readTime=i,this.createTime=o,this.data=c,this.documentState=l}static newInvalidDocument(t){return new Et(t,0,L.min(),L.min(),L.min(),Dt.empty(),0)}static newFoundDocument(t,e,n,i){return new Et(t,1,e,L.min(),n,i,0)}static newNoDocument(t,e){return new Et(t,2,e,L.min(),L.min(),Dt.empty(),0)}static newUnknownDocument(t,e){return new Et(t,3,e,L.min(),L.min(),Dt.empty(),2)}convertToFoundDocument(t,e){return!this.createTime.isEqual(L.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=t),this.version=t,this.documentType=1,this.data=e,this.documentState=0,this}convertToNoDocument(t){return this.version=t,this.documentType=2,this.data=Dt.empty(),this.documentState=0,this}convertToUnknownDocument(t){return this.version=t,this.documentType=3,this.data=Dt.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=L.min(),this}setReadTime(t){return this.readTime=t,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(t){return t instanceof Et&&this.key.isEqual(t.key)&&this.version.isEqual(t.version)&&this.documentType===t.documentType&&this.documentState===t.documentState&&this.data.isEqual(t.data)}mutableCopy(){return new Et(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}/**
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
 */class tr{constructor(t,e){this.position=t,this.inclusive=e}}function Vo(r,t,e){let n=0;for(let i=0;i<r.position.length;i++){const o=t[i],c=r.position[i];if(o.field.isKeyField()?n=O.comparator(O.fromName(c.referenceValue),e.key):n=De(c,e.data.field(o.field)),o.dir==="desc"&&(n*=-1),n!==0)break}return n}function Do(r,t){if(r===null)return t===null;if(t===null||r.inclusive!==t.inclusive||r.position.length!==t.position.length)return!1;for(let e=0;e<r.position.length;e++)if(!kt(r.position[e],t.position[e]))return!1;return!0}/**
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
 */class er{constructor(t,e="asc"){this.field=t,this.dir=e}}function Sh(r,t){return r.dir===t.dir&&r.field.isEqual(t.field)}/**
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
 */class Ma{}class at extends Ma{constructor(t,e,n){super(),this.field=t,this.op=e,this.value=n}static create(t,e,n){return t.isKeyField()?e==="in"||e==="not-in"?this.createKeyFieldInFilter(t,e,n):new bh(t,e,n):e==="array-contains"?new Nh(t,n):e==="in"?new xh(t,n):e==="not-in"?new kh(t,n):e==="array-contains-any"?new Oh(t,n):new at(t,e,n)}static createKeyFieldInFilter(t,e,n){return e==="in"?new Vh(t,n):new Dh(t,n)}matches(t){const e=t.data.field(this.field);return this.op==="!="?e!==null&&e.nullValue===void 0&&this.matchesComparison(De(e,this.value)):e!==null&&ee(this.value)===ee(e)&&this.matchesComparison(De(e,this.value))}matchesComparison(t){switch(this.op){case"<":return t<0;case"<=":return t<=0;case"==":return t===0;case"!=":return t!==0;case">":return t>0;case">=":return t>=0;default:return F(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class Ot extends Ma{constructor(t,e){super(),this.filters=t,this.op=e,this.Pe=null}static create(t,e){return new Ot(t,e)}matches(t){return La(this)?this.filters.find(e=>!e.matches(t))===void 0:this.filters.find(e=>e.matches(t))!==void 0}getFlattenedFilters(){return this.Pe!==null||(this.Pe=this.filters.reduce((t,e)=>t.concat(e.getFlattenedFilters()),[])),this.Pe}getFilters(){return Object.assign([],this.filters)}}function La(r){return r.op==="and"}function Fa(r){return Ph(r)&&La(r)}function Ph(r){for(const t of r.filters)if(t instanceof Ot)return!1;return!0}function gs(r){if(r instanceof at)return r.field.canonicalString()+r.op.toString()+Ne(r.value);if(Fa(r))return r.filters.map(t=>gs(t)).join(",");{const t=r.filters.map(e=>gs(e)).join(",");return`${r.op}(${t})`}}function Ua(r,t){return r instanceof at?function(n,i){return i instanceof at&&n.op===i.op&&n.field.isEqual(i.field)&&kt(n.value,i.value)}(r,t):r instanceof Ot?function(n,i){return i instanceof Ot&&n.op===i.op&&n.filters.length===i.filters.length?n.filters.reduce((o,c,l)=>o&&Ua(c,i.filters[l]),!0):!1}(r,t):void F(19439)}function Ba(r){return r instanceof at?function(e){return`${e.field.canonicalString()} ${e.op} ${Ne(e.value)}`}(r):r instanceof Ot?function(e){return e.op.toString()+" {"+e.getFilters().map(Ba).join(" ,")+"}"}(r):"Filter"}class bh extends at{constructor(t,e,n){super(t,e,n),this.key=O.fromName(n.referenceValue)}matches(t){const e=O.comparator(t.key,this.key);return this.matchesComparison(e)}}class Vh extends at{constructor(t,e){super(t,"in",e),this.keys=ja("in",e)}matches(t){return this.keys.some(e=>e.isEqual(t.key))}}class Dh extends at{constructor(t,e){super(t,"not-in",e),this.keys=ja("not-in",e)}matches(t){return!this.keys.some(e=>e.isEqual(t.key))}}function ja(r,t){var e;return(((e=t.arrayValue)==null?void 0:e.values)||[]).map(n=>O.fromName(n.referenceValue))}class Nh extends at{constructor(t,e){super(t,"array-contains",e)}matches(t){const e=t.data.field(this.field);return xs(e)&&En(e.arrayValue,this.value)}}class xh extends at{constructor(t,e){super(t,"in",e)}matches(t){const e=t.data.field(this.field);return e!==null&&En(this.value.arrayValue,e)}}class kh extends at{constructor(t,e){super(t,"not-in",e)}matches(t){if(En(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const e=t.data.field(this.field);return e!==null&&e.nullValue===void 0&&!En(this.value.arrayValue,e)}}class Oh extends at{constructor(t,e){super(t,"array-contains-any",e)}matches(t){const e=t.data.field(this.field);return!(!xs(e)||!e.arrayValue.values)&&e.arrayValue.values.some(n=>En(this.value.arrayValue,n))}}/**
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
 */class Mh{constructor(t,e=null,n=[],i=[],o=null,c=null,l=null){this.path=t,this.collectionGroup=e,this.orderBy=n,this.filters=i,this.limit=o,this.startAt=c,this.endAt=l,this.Te=null}}function No(r,t=null,e=[],n=[],i=null,o=null,c=null){return new Mh(r,t,e,n,i,o,c)}function ks(r){const t=$(r);if(t.Te===null){let e=t.path.canonicalString();t.collectionGroup!==null&&(e+="|cg:"+t.collectionGroup),e+="|f:",e+=t.filters.map(n=>gs(n)).join(","),e+="|ob:",e+=t.orderBy.map(n=>function(o){return o.field.canonicalString()+o.dir}(n)).join(","),cr(t.limit)||(e+="|l:",e+=t.limit),t.startAt&&(e+="|lb:",e+=t.startAt.inclusive?"b:":"a:",e+=t.startAt.position.map(n=>Ne(n)).join(",")),t.endAt&&(e+="|ub:",e+=t.endAt.inclusive?"a:":"b:",e+=t.endAt.position.map(n=>Ne(n)).join(",")),t.Te=e}return t.Te}function Os(r,t){if(r.limit!==t.limit||r.orderBy.length!==t.orderBy.length)return!1;for(let e=0;e<r.orderBy.length;e++)if(!Sh(r.orderBy[e],t.orderBy[e]))return!1;if(r.filters.length!==t.filters.length)return!1;for(let e=0;e<r.filters.length;e++)if(!Ua(r.filters[e],t.filters[e]))return!1;return r.collectionGroup===t.collectionGroup&&!!r.path.isEqual(t.path)&&!!Do(r.startAt,t.startAt)&&Do(r.endAt,t.endAt)}function ps(r){return O.isDocumentKey(r.path)&&r.collectionGroup===null&&r.filters.length===0}/**
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
 */class lr{constructor(t,e=null,n=[],i=[],o=null,c="F",l=null,d=null){this.path=t,this.collectionGroup=e,this.explicitOrderBy=n,this.filters=i,this.limit=o,this.limitType=c,this.startAt=l,this.endAt=d,this.Ie=null,this.Ee=null,this.de=null,this.startAt,this.endAt}}function Lh(r,t,e,n,i,o,c,l){return new lr(r,t,e,n,i,o,c,l)}function Ms(r){return new lr(r)}function xo(r){return r.filters.length===0&&r.limit===null&&r.startAt==null&&r.endAt==null&&(r.explicitOrderBy.length===0||r.explicitOrderBy.length===1&&r.explicitOrderBy[0].field.isKeyField())}function Fh(r){return r.collectionGroup!==null}function un(r){const t=$(r);if(t.Ie===null){t.Ie=[];const e=new Set;for(const o of t.explicitOrderBy)t.Ie.push(o),e.add(o.field.canonicalString());const n=t.explicitOrderBy.length>0?t.explicitOrderBy[t.explicitOrderBy.length-1].dir:"asc";(function(c){let l=new ct(It.comparator);return c.filters.forEach(d=>{d.getFlattenedFilters().forEach(f=>{f.isInequality()&&(l=l.add(f.field))})}),l})(t).forEach(o=>{e.has(o.canonicalString())||o.isKeyField()||t.Ie.push(new er(o,n))}),e.has(It.keyField().canonicalString())||t.Ie.push(new er(It.keyField(),n))}return t.Ie}function xt(r){const t=$(r);return t.Ee||(t.Ee=Uh(t,un(r))),t.Ee}function Uh(r,t){if(r.limitType==="F")return No(r.path,r.collectionGroup,t,r.filters,r.limit,r.startAt,r.endAt);{t=t.map(i=>{const o=i.dir==="desc"?"asc":"desc";return new er(i.field,o)});const e=r.endAt?new tr(r.endAt.position,r.endAt.inclusive):null,n=r.startAt?new tr(r.startAt.position,r.startAt.inclusive):null;return No(r.path,r.collectionGroup,t,r.filters,r.limit,e,n)}}function _s(r,t,e){return new lr(r.path,r.collectionGroup,r.explicitOrderBy.slice(),r.filters.slice(),t,e,r.startAt,r.endAt)}function hr(r,t){return Os(xt(r),xt(t))&&r.limitType===t.limitType}function qa(r){return`${ks(xt(r))}|lt:${r.limitType}`}function we(r){return`Query(target=${function(e){let n=e.path.canonicalString();return e.collectionGroup!==null&&(n+=" collectionGroup="+e.collectionGroup),e.filters.length>0&&(n+=`, filters: [${e.filters.map(i=>Ba(i)).join(", ")}]`),cr(e.limit)||(n+=", limit: "+e.limit),e.orderBy.length>0&&(n+=`, orderBy: [${e.orderBy.map(i=>function(c){return`${c.field.canonicalString()} (${c.dir})`}(i)).join(", ")}]`),e.startAt&&(n+=", startAt: ",n+=e.startAt.inclusive?"b:":"a:",n+=e.startAt.position.map(i=>Ne(i)).join(",")),e.endAt&&(n+=", endAt: ",n+=e.endAt.inclusive?"a:":"b:",n+=e.endAt.position.map(i=>Ne(i)).join(",")),`Target(${n})`}(xt(r))}; limitType=${r.limitType})`}function dr(r,t){return t.isFoundDocument()&&function(n,i){const o=i.key.path;return n.collectionGroup!==null?i.key.hasCollectionId(n.collectionGroup)&&n.path.isPrefixOf(o):O.isDocumentKey(n.path)?n.path.isEqual(o):n.path.isImmediateParentOf(o)}(r,t)&&function(n,i){for(const o of un(n))if(!o.field.isKeyField()&&i.data.field(o.field)===null)return!1;return!0}(r,t)&&function(n,i){for(const o of n.filters)if(!o.matches(i))return!1;return!0}(r,t)&&function(n,i){return!(n.startAt&&!function(c,l,d){const f=Vo(c,l,d);return c.inclusive?f<=0:f<0}(n.startAt,un(n),i)||n.endAt&&!function(c,l,d){const f=Vo(c,l,d);return c.inclusive?f>=0:f>0}(n.endAt,un(n),i))}(r,t)}function Bh(r){return r.collectionGroup||(r.path.length%2==1?r.path.lastSegment():r.path.get(r.path.length-2))}function $a(r){return(t,e)=>{let n=!1;for(const i of un(r)){const o=jh(i,t,e);if(o!==0)return o;n=n||i.field.isKeyField()}return 0}}function jh(r,t,e){const n=r.field.isKeyField()?O.comparator(t.key,e.key):function(o,c,l){const d=c.data.field(o),f=l.data.field(o);return d!==null&&f!==null?De(d,f):F(42886)}(r.field,t,e);switch(r.dir){case"asc":return n;case"desc":return-1*n;default:return F(19790,{direction:r.dir})}}/**
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
 */class pe{constructor(t,e){this.mapKeyFn=t,this.equalsFn=e,this.inner={},this.innerSize=0}get(t){const e=this.mapKeyFn(t),n=this.inner[e];if(n!==void 0){for(const[i,o]of n)if(this.equalsFn(i,t))return o}}has(t){return this.get(t)!==void 0}set(t,e){const n=this.mapKeyFn(t),i=this.inner[n];if(i===void 0)return this.inner[n]=[[t,e]],void this.innerSize++;for(let o=0;o<i.length;o++)if(this.equalsFn(i[o][0],t))return void(i[o]=[t,e]);i.push([t,e]),this.innerSize++}delete(t){const e=this.mapKeyFn(t),n=this.inner[e];if(n===void 0)return!1;for(let i=0;i<n.length;i++)if(this.equalsFn(n[i][0],t))return n.length===1?delete this.inner[e]:n.splice(i,1),this.innerSize--,!0;return!1}forEach(t){In(this.inner,(e,n)=>{for(const[i,o]of n)t(i,o)})}isEmpty(){return Eh(this.inner)}size(){return this.innerSize}}/**
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
 */const qh=new nt(O.comparator);function ne(){return qh}const za=new nt(O.comparator);function rn(...r){let t=za;for(const e of r)t=t.insert(e.key,e);return t}function $h(r){let t=za;return r.forEach((e,n)=>t=t.insert(e,n.overlayedDocument)),t}function le(){return ln()}function Ha(){return ln()}function ln(){return new pe(r=>r.toString(),(r,t)=>r.isEqual(t))}const zh=new ct(O.comparator);function z(...r){let t=zh;for(const e of r)t=t.add(e);return t}const Hh=new ct(B);function Gh(){return Hh}/**
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
 */function Kh(r,t){if(r.useProto3Json){if(isNaN(t))return{doubleValue:"NaN"};if(t===1/0)return{doubleValue:"Infinity"};if(t===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:hs(t)?"-0":t}}function Qh(r){return{integerValue:""+r}}/**
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
 */class fr{constructor(){this._=void 0}}function Wh(r,t,e){return r instanceof ys?function(i,o){const c={fields:{[xa]:{stringValue:Na},[Oa]:{timestampValue:{seconds:i.seconds,nanos:i.nanoseconds}}}};return o&&Ns(o)&&(o=ur(o)),o&&(c.fields[ka]=o),{mapValue:c}}(e,t):r instanceof nr?Ga(r,t):r instanceof rr?Ka(r,t):function(i,o){const c=Yh(i,o),l=ko(c)+ko(i.Ae);return ms(c)&&ms(i.Ae)?Qh(l):Kh(i.serializer,l)}(r,t)}function Xh(r,t,e){return r instanceof nr?Ga(r,t):r instanceof rr?Ka(r,t):e}function Yh(r,t){return r instanceof Es?function(n){return ms(n)||function(o){return!!o&&"doubleValue"in o}(n)}(t)?t:{integerValue:0}:null}class ys extends fr{}class nr extends fr{constructor(t){super(),this.elements=t}}function Ga(r,t){const e=Qa(t);for(const n of r.elements)e.some(i=>kt(i,n))||e.push(n);return{arrayValue:{values:e}}}class rr extends fr{constructor(t){super(),this.elements=t}}function Ka(r,t){let e=Qa(t);for(const n of r.elements)e=e.filter(i=>!kt(i,n));return{arrayValue:{values:e}}}class Es extends fr{constructor(t,e){super(),this.serializer=t,this.Ae=e}}function ko(r){return et(r.integerValue||r.doubleValue)}function Qa(r){return xs(r)&&r.arrayValue.values?r.arrayValue.values.slice():[]}function Jh(r,t){return r.field.isEqual(t.field)&&function(n,i){return n instanceof nr&&i instanceof nr||n instanceof rr&&i instanceof rr?Ve(n.elements,i.elements,kt):n instanceof Es&&i instanceof Es?kt(n.Ae,i.Ae):n instanceof ys&&i instanceof ys}(r.transform,t.transform)}class de{constructor(t,e){this.updateTime=t,this.exists=e}static none(){return new de}static exists(t){return new de(void 0,t)}static updateTime(t){return new de(t)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(t){return this.exists===t.exists&&(this.updateTime?!!t.updateTime&&this.updateTime.isEqual(t.updateTime):!t.updateTime)}}function Kn(r,t){return r.updateTime!==void 0?t.isFoundDocument()&&t.version.isEqual(r.updateTime):r.exists===void 0||r.exists===t.isFoundDocument()}class Ls{}function Wa(r,t){if(!r.hasLocalMutations||t&&t.fields.length===0)return null;if(t===null)return r.isNoDocument()?new td(r.key,de.none()):new Fs(r.key,r.data,de.none());{const e=r.data,n=Dt.empty();let i=new ct(It.comparator);for(let o of t.fields)if(!i.has(o)){let c=e.field(o);c===null&&o.length>1&&(o=o.popLast(),c=e.field(o)),c===null?n.delete(o):n.set(o,c),i=i.add(o)}return new mr(r.key,n,new Ht(i.toArray()),de.none())}}function Zh(r,t,e){r instanceof Fs?function(i,o,c){const l=i.value.clone(),d=Mo(i.fieldTransforms,o,c.transformResults);l.setAll(d),o.convertToFoundDocument(c.version,l).setHasCommittedMutations()}(r,t,e):r instanceof mr?function(i,o,c){if(!Kn(i.precondition,o))return void o.convertToUnknownDocument(c.version);const l=Mo(i.fieldTransforms,o,c.transformResults),d=o.data;d.setAll(Xa(i)),d.setAll(l),o.convertToFoundDocument(c.version,d).setHasCommittedMutations()}(r,t,e):function(i,o,c){o.convertToNoDocument(c.version).setHasCommittedMutations()}(0,t,e)}function hn(r,t,e,n){return r instanceof Fs?function(o,c,l,d){if(!Kn(o.precondition,c))return l;const f=o.value.clone(),_=Lo(o.fieldTransforms,d,c);return f.setAll(_),c.convertToFoundDocument(c.version,f).setHasLocalMutations(),null}(r,t,e,n):r instanceof mr?function(o,c,l,d){if(!Kn(o.precondition,c))return l;const f=Lo(o.fieldTransforms,d,c),_=c.data;return _.setAll(Xa(o)),_.setAll(f),c.convertToFoundDocument(c.version,_).setHasLocalMutations(),l===null?null:l.unionWith(o.fieldMask.fields).unionWith(o.fieldTransforms.map(v=>v.field))}(r,t,e,n):function(o,c,l){return Kn(o.precondition,c)?(c.convertToNoDocument(c.version).setHasLocalMutations(),null):l}(r,t,e)}function Oo(r,t){return r.type===t.type&&!!r.key.isEqual(t.key)&&!!r.precondition.isEqual(t.precondition)&&!!function(n,i){return n===void 0&&i===void 0||!(!n||!i)&&Ve(n,i,(o,c)=>Jh(o,c))}(r.fieldTransforms,t.fieldTransforms)&&(r.type===0?r.value.isEqual(t.value):r.type!==1||r.data.isEqual(t.data)&&r.fieldMask.isEqual(t.fieldMask))}class Fs extends Ls{constructor(t,e,n,i=[]){super(),this.key=t,this.value=e,this.precondition=n,this.fieldTransforms=i,this.type=0}getFieldMask(){return null}}class mr extends Ls{constructor(t,e,n,i,o=[]){super(),this.key=t,this.data=e,this.fieldMask=n,this.precondition=i,this.fieldTransforms=o,this.type=1}getFieldMask(){return this.fieldMask}}function Xa(r){const t=new Map;return r.fieldMask.fields.forEach(e=>{if(!e.isEmpty()){const n=r.data.field(e);t.set(e,n)}}),t}function Mo(r,t,e){const n=new Map;Y(r.length===e.length,32656,{Re:e.length,Ve:r.length});for(let i=0;i<e.length;i++){const o=r[i],c=o.transform,l=t.data.field(o.field);n.set(o.field,Xh(c,l,e[i]))}return n}function Lo(r,t,e){const n=new Map;for(const i of r){const o=i.transform,c=e.data.field(i.field);n.set(i.field,Wh(o,c,t))}return n}class td extends Ls{constructor(t,e){super(),this.key=t,this.precondition=e,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}/**
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
 */class ed{constructor(t,e,n,i){this.batchId=t,this.localWriteTime=e,this.baseMutations=n,this.mutations=i}applyToRemoteDocument(t,e){const n=e.mutationResults;for(let i=0;i<this.mutations.length;i++){const o=this.mutations[i];o.key.isEqual(t.key)&&Zh(o,t,n[i])}}applyToLocalView(t,e){for(const n of this.baseMutations)n.key.isEqual(t.key)&&(e=hn(n,t,e,this.localWriteTime));for(const n of this.mutations)n.key.isEqual(t.key)&&(e=hn(n,t,e,this.localWriteTime));return e}applyToLocalDocumentSet(t,e){const n=Ha();return this.mutations.forEach(i=>{const o=t.get(i.key),c=o.overlayedDocument;let l=this.applyToLocalView(c,o.mutatedFields);l=e.has(i.key)?null:l;const d=Wa(c,l);d!==null&&n.set(i.key,d),c.isValidDocument()||c.convertToNoDocument(L.min())}),n}keys(){return this.mutations.reduce((t,e)=>t.add(e.key),z())}isEqual(t){return this.batchId===t.batchId&&Ve(this.mutations,t.mutations,(e,n)=>Oo(e,n))&&Ve(this.baseMutations,t.baseMutations,(e,n)=>Oo(e,n))}}/**
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
 */class nd{constructor(t,e){this.largestBatchId=t,this.mutation=e}getKey(){return this.mutation.key}isEqual(t){return t!==null&&this.mutation===t.mutation}toString(){return`Overlay{
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
 */class rd{constructor(t,e){this.count=t,this.unchangedNames=e}}/**
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
 */var rt,j;function Ya(r){if(r===void 0)return Ft("GRPC error has no .code"),P.UNKNOWN;switch(r){case rt.OK:return P.OK;case rt.CANCELLED:return P.CANCELLED;case rt.UNKNOWN:return P.UNKNOWN;case rt.DEADLINE_EXCEEDED:return P.DEADLINE_EXCEEDED;case rt.RESOURCE_EXHAUSTED:return P.RESOURCE_EXHAUSTED;case rt.INTERNAL:return P.INTERNAL;case rt.UNAVAILABLE:return P.UNAVAILABLE;case rt.UNAUTHENTICATED:return P.UNAUTHENTICATED;case rt.INVALID_ARGUMENT:return P.INVALID_ARGUMENT;case rt.NOT_FOUND:return P.NOT_FOUND;case rt.ALREADY_EXISTS:return P.ALREADY_EXISTS;case rt.PERMISSION_DENIED:return P.PERMISSION_DENIED;case rt.FAILED_PRECONDITION:return P.FAILED_PRECONDITION;case rt.ABORTED:return P.ABORTED;case rt.OUT_OF_RANGE:return P.OUT_OF_RANGE;case rt.UNIMPLEMENTED:return P.UNIMPLEMENTED;case rt.DATA_LOSS:return P.DATA_LOSS;default:return F(39323,{code:r})}}(j=rt||(rt={}))[j.OK=0]="OK",j[j.CANCELLED=1]="CANCELLED",j[j.UNKNOWN=2]="UNKNOWN",j[j.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",j[j.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",j[j.NOT_FOUND=5]="NOT_FOUND",j[j.ALREADY_EXISTS=6]="ALREADY_EXISTS",j[j.PERMISSION_DENIED=7]="PERMISSION_DENIED",j[j.UNAUTHENTICATED=16]="UNAUTHENTICATED",j[j.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",j[j.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",j[j.ABORTED=10]="ABORTED",j[j.OUT_OF_RANGE=11]="OUT_OF_RANGE",j[j.UNIMPLEMENTED=12]="UNIMPLEMENTED",j[j.INTERNAL=13]="INTERNAL",j[j.UNAVAILABLE=14]="UNAVAILABLE",j[j.DATA_LOSS=15]="DATA_LOSS";/**
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
 */function sd(){return new TextEncoder}/**
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
 */const id=new Wt([4294967295,4294967295],0);function Fo(r){const t=sd().encode(r),e=new Ia;return e.update(t),new Uint8Array(e.digest())}function Uo(r){const t=new DataView(r.buffer),e=t.getUint32(0,!0),n=t.getUint32(4,!0),i=t.getUint32(8,!0),o=t.getUint32(12,!0);return[new Wt([e,n],0),new Wt([i,o],0)]}class Us{constructor(t,e,n){if(this.bitmap=t,this.padding=e,this.hashCount=n,e<0||e>=8)throw new sn(`Invalid padding: ${e}`);if(n<0)throw new sn(`Invalid hash count: ${n}`);if(t.length>0&&this.hashCount===0)throw new sn(`Invalid hash count: ${n}`);if(t.length===0&&e!==0)throw new sn(`Invalid padding when bitmap length is 0: ${e}`);this.ge=8*t.length-e,this.pe=Wt.fromNumber(this.ge)}ye(t,e,n){let i=t.add(e.multiply(Wt.fromNumber(n)));return i.compare(id)===1&&(i=new Wt([i.getBits(0),i.getBits(1)],0)),i.modulo(this.pe).toNumber()}we(t){return!!(this.bitmap[Math.floor(t/8)]&1<<t%8)}mightContain(t){if(this.ge===0)return!1;const e=Fo(t),[n,i]=Uo(e);for(let o=0;o<this.hashCount;o++){const c=this.ye(n,i,o);if(!this.we(c))return!1}return!0}static create(t,e,n){const i=t%8==0?0:8-t%8,o=new Uint8Array(Math.ceil(t/8)),c=new Us(o,i,e);return n.forEach(l=>c.insert(l)),c}insert(t){if(this.ge===0)return;const e=Fo(t),[n,i]=Uo(e);for(let o=0;o<this.hashCount;o++){const c=this.ye(n,i,o);this.Se(c)}}Se(t){const e=Math.floor(t/8),n=t%8;this.bitmap[e]|=1<<n}}class sn extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}/**
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
 */class gr{constructor(t,e,n,i,o){this.snapshotVersion=t,this.targetChanges=e,this.targetMismatches=n,this.documentUpdates=i,this.resolvedLimboDocuments=o}static createSynthesizedRemoteEventForCurrentChange(t,e,n){const i=new Map;return i.set(t,wn.createSynthesizedTargetChangeForCurrentChange(t,e,n)),new gr(L.min(),i,new nt(B),ne(),z())}}class wn{constructor(t,e,n,i,o){this.resumeToken=t,this.current=e,this.addedDocuments=n,this.modifiedDocuments=i,this.removedDocuments=o}static createSynthesizedTargetChangeForCurrentChange(t,e,n){return new wn(n,e,z(),z(),z())}}/**
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
 */class Qn{constructor(t,e,n,i){this.be=t,this.removedTargetIds=e,this.key=n,this.De=i}}class Ja{constructor(t,e){this.targetId=t,this.Ce=e}}class Za{constructor(t,e,n=mt.EMPTY_BYTE_STRING,i=null){this.state=t,this.targetIds=e,this.resumeToken=n,this.cause=i}}class Bo{constructor(){this.ve=0,this.Fe=jo(),this.Me=mt.EMPTY_BYTE_STRING,this.xe=!1,this.Oe=!0}get current(){return this.xe}get resumeToken(){return this.Me}get Ne(){return this.ve!==0}get Be(){return this.Oe}Le(t){t.approximateByteSize()>0&&(this.Oe=!0,this.Me=t)}ke(){let t=z(),e=z(),n=z();return this.Fe.forEach((i,o)=>{switch(o){case 0:t=t.add(i);break;case 2:e=e.add(i);break;case 1:n=n.add(i);break;default:F(38017,{changeType:o})}}),new wn(this.Me,this.xe,t,e,n)}qe(){this.Oe=!1,this.Fe=jo()}Qe(t,e){this.Oe=!0,this.Fe=this.Fe.insert(t,e)}$e(t){this.Oe=!0,this.Fe=this.Fe.remove(t)}Ue(){this.ve+=1}Ke(){this.ve-=1,Y(this.ve>=0,3241,{ve:this.ve})}We(){this.Oe=!0,this.xe=!0}}class od{constructor(t){this.Ge=t,this.ze=new Map,this.je=ne(),this.Je=$n(),this.He=$n(),this.Ye=new nt(B)}Ze(t){for(const e of t.be)t.De&&t.De.isFoundDocument()?this.Xe(e,t.De):this.et(e,t.key,t.De);for(const e of t.removedTargetIds)this.et(e,t.key,t.De)}tt(t){this.forEachTarget(t,e=>{const n=this.nt(e);switch(t.state){case 0:this.rt(e)&&n.Le(t.resumeToken);break;case 1:n.Ke(),n.Ne||n.qe(),n.Le(t.resumeToken);break;case 2:n.Ke(),n.Ne||this.removeTarget(e);break;case 3:this.rt(e)&&(n.We(),n.Le(t.resumeToken));break;case 4:this.rt(e)&&(this.it(e),n.Le(t.resumeToken));break;default:F(56790,{state:t.state})}})}forEachTarget(t,e){t.targetIds.length>0?t.targetIds.forEach(e):this.ze.forEach((n,i)=>{this.rt(i)&&e(i)})}st(t){const e=t.targetId,n=t.Ce.count,i=this.ot(e);if(i){const o=i.target;if(ps(o))if(n===0){const c=new O(o.path);this.et(e,c,Et.newNoDocument(c,L.min()))}else Y(n===1,20013,{expectedCount:n});else{const c=this._t(e);if(c!==n){const l=this.ut(t),d=l?this.ct(l,t,c):1;if(d!==0){this.it(e);const f=d===2?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.Ye=this.Ye.insert(e,f)}}}}}ut(t){const e=t.Ce.unchangedNames;if(!e||!e.bits)return null;const{bits:{bitmap:n="",padding:i=0},hashCount:o=0}=e;let c,l;try{c=te(n).toUint8Array()}catch(d){if(d instanceof Da)return be("Decoding the base64 bloom filter in existence filter failed ("+d.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw d}try{l=new Us(c,i,o)}catch(d){return be(d instanceof sn?"BloomFilter error: ":"Applying bloom filter failed: ",d),null}return l.ge===0?null:l}ct(t,e,n){return e.Ce.count===n-this.Pt(t,e.targetId)?0:2}Pt(t,e){const n=this.Ge.getRemoteKeysForTarget(e);let i=0;return n.forEach(o=>{const c=this.Ge.ht(),l=`projects/${c.projectId}/databases/${c.database}/documents/${o.path.canonicalString()}`;t.mightContain(l)||(this.et(e,o,null),i++)}),i}Tt(t){const e=new Map;this.ze.forEach((o,c)=>{const l=this.ot(c);if(l){if(o.current&&ps(l.target)){const d=new O(l.target.path);this.It(d).has(c)||this.Et(c,d)||this.et(c,d,Et.newNoDocument(d,t))}o.Be&&(e.set(c,o.ke()),o.qe())}});let n=z();this.He.forEach((o,c)=>{let l=!0;c.forEachWhile(d=>{const f=this.ot(d);return!f||f.purpose==="TargetPurposeLimboResolution"||(l=!1,!1)}),l&&(n=n.add(o))}),this.je.forEach((o,c)=>c.setReadTime(t));const i=new gr(t,e,this.Ye,this.je,n);return this.je=ne(),this.Je=$n(),this.He=$n(),this.Ye=new nt(B),i}Xe(t,e){if(!this.rt(t))return;const n=this.Et(t,e.key)?2:0;this.nt(t).Qe(e.key,n),this.je=this.je.insert(e.key,e),this.Je=this.Je.insert(e.key,this.It(e.key).add(t)),this.He=this.He.insert(e.key,this.dt(e.key).add(t))}et(t,e,n){if(!this.rt(t))return;const i=this.nt(t);this.Et(t,e)?i.Qe(e,1):i.$e(e),this.He=this.He.insert(e,this.dt(e).delete(t)),this.He=this.He.insert(e,this.dt(e).add(t)),n&&(this.je=this.je.insert(e,n))}removeTarget(t){this.ze.delete(t)}_t(t){const e=this.nt(t).ke();return this.Ge.getRemoteKeysForTarget(t).size+e.addedDocuments.size-e.removedDocuments.size}Ue(t){this.nt(t).Ue()}nt(t){let e=this.ze.get(t);return e||(e=new Bo,this.ze.set(t,e)),e}dt(t){let e=this.He.get(t);return e||(e=new ct(B),this.He=this.He.insert(t,e)),e}It(t){let e=this.Je.get(t);return e||(e=new ct(B),this.Je=this.Je.insert(t,e)),e}rt(t){const e=this.ot(t)!==null;return e||V("WatchChangeAggregator","Detected inactive target",t),e}ot(t){const e=this.ze.get(t);return e&&e.Ne?null:this.Ge.At(t)}it(t){this.ze.set(t,new Bo),this.Ge.getRemoteKeysForTarget(t).forEach(e=>{this.et(t,e,null)})}Et(t,e){return this.Ge.getRemoteKeysForTarget(t).has(e)}}function $n(){return new nt(O.comparator)}function jo(){return new nt(O.comparator)}const ad={asc:"ASCENDING",desc:"DESCENDING"},cd={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},ud={and:"AND",or:"OR"};class ld{constructor(t,e){this.databaseId=t,this.useProto3Json=e}}function Ts(r,t){return r.useProto3Json||cr(t)?t:{value:t}}function hd(r,t){return r.useProto3Json?`${new Date(1e3*t.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+t.nanoseconds).slice(-9)}Z`:{seconds:""+t.seconds,nanos:t.nanoseconds}}function dd(r,t){return r.useProto3Json?t.toBase64():t.toUint8Array()}function Se(r){return Y(!!r,49232),L.fromTimestamp(function(e){const n=Zt(e);return new st(n.seconds,n.nanos)}(r))}function fd(r,t){return vs(r,t).canonicalString()}function vs(r,t){const e=function(i){return new X(["projects",i.projectId,"databases",i.database])}(r).child("documents");return t===void 0?e:e.child(t)}function tc(r){const t=X.fromString(r);return Y(ic(t),10190,{key:t.toString()}),t}function Kr(r,t){const e=tc(t);if(e.get(1)!==r.databaseId.projectId)throw new x(P.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+e.get(1)+" vs "+r.databaseId.projectId);if(e.get(3)!==r.databaseId.database)throw new x(P.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+e.get(3)+" vs "+r.databaseId.database);return new O(nc(e))}function ec(r,t){return fd(r.databaseId,t)}function md(r){const t=tc(r);return t.length===4?X.emptyPath():nc(t)}function qo(r){return new X(["projects",r.databaseId.projectId,"databases",r.databaseId.database]).canonicalString()}function nc(r){return Y(r.length>4&&r.get(4)==="documents",29091,{key:r.toString()}),r.popFirst(5)}function gd(r,t){let e;if("targetChange"in t){t.targetChange;const n=function(f){return f==="NO_CHANGE"?0:f==="ADD"?1:f==="REMOVE"?2:f==="CURRENT"?3:f==="RESET"?4:F(39313,{state:f})}(t.targetChange.targetChangeType||"NO_CHANGE"),i=t.targetChange.targetIds||[],o=function(f,_){return f.useProto3Json?(Y(_===void 0||typeof _=="string",58123),mt.fromBase64String(_||"")):(Y(_===void 0||_ instanceof Buffer||_ instanceof Uint8Array,16193),mt.fromUint8Array(_||new Uint8Array))}(r,t.targetChange.resumeToken),c=t.targetChange.cause,l=c&&function(f){const _=f.code===void 0?P.UNKNOWN:Ya(f.code);return new x(_,f.message||"")}(c);e=new Za(n,i,o,l||null)}else if("documentChange"in t){t.documentChange;const n=t.documentChange;n.document,n.document.name,n.document.updateTime;const i=Kr(r,n.document.name),o=Se(n.document.updateTime),c=n.document.createTime?Se(n.document.createTime):L.min(),l=new Dt({mapValue:{fields:n.document.fields}}),d=Et.newFoundDocument(i,o,c,l),f=n.targetIds||[],_=n.removedTargetIds||[];e=new Qn(f,_,d.key,d)}else if("documentDelete"in t){t.documentDelete;const n=t.documentDelete;n.document;const i=Kr(r,n.document),o=n.readTime?Se(n.readTime):L.min(),c=Et.newNoDocument(i,o),l=n.removedTargetIds||[];e=new Qn([],l,c.key,c)}else if("documentRemove"in t){t.documentRemove;const n=t.documentRemove;n.document;const i=Kr(r,n.document),o=n.removedTargetIds||[];e=new Qn([],o,i,null)}else{if(!("filter"in t))return F(11601,{Rt:t});{t.filter;const n=t.filter;n.targetId;const{count:i=0,unchangedNames:o}=n,c=new rd(i,o),l=n.targetId;e=new Ja(l,c)}}return e}function pd(r,t){return{documents:[ec(r,t.path)]}}function _d(r,t){const e={structuredQuery:{}},n=t.path;let i;t.collectionGroup!==null?(i=n,e.structuredQuery.from=[{collectionId:t.collectionGroup,allDescendants:!0}]):(i=n.popLast(),e.structuredQuery.from=[{collectionId:n.lastSegment()}]),e.parent=ec(r,i);const o=function(f){if(f.length!==0)return sc(Ot.create(f,"and"))}(t.filters);o&&(e.structuredQuery.where=o);const c=function(f){if(f.length!==0)return f.map(_=>function(R){return{field:Ae(R.field),direction:Td(R.dir)}}(_))}(t.orderBy);c&&(e.structuredQuery.orderBy=c);const l=Ts(r,t.limit);return l!==null&&(e.structuredQuery.limit=l),t.startAt&&(e.structuredQuery.startAt=function(f){return{before:f.inclusive,values:f.position}}(t.startAt)),t.endAt&&(e.structuredQuery.endAt=function(f){return{before:!f.inclusive,values:f.position}}(t.endAt)),{ft:e,parent:i}}function yd(r){let t=md(r.parent);const e=r.structuredQuery,n=e.from?e.from.length:0;let i=null;if(n>0){Y(n===1,65062);const _=e.from[0];_.allDescendants?i=_.collectionId:t=t.child(_.collectionId)}let o=[];e.where&&(o=function(v){const R=rc(v);return R instanceof Ot&&Fa(R)?R.getFilters():[R]}(e.where));let c=[];e.orderBy&&(c=function(v){return v.map(R=>function(N){return new er(Re(N.field),function(D){switch(D){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}}(N.direction))}(R))}(e.orderBy));let l=null;e.limit&&(l=function(v){let R;return R=typeof v=="object"?v.value:v,cr(R)?null:R}(e.limit));let d=null;e.startAt&&(d=function(v){const R=!!v.before,S=v.values||[];return new tr(S,R)}(e.startAt));let f=null;return e.endAt&&(f=function(v){const R=!v.before,S=v.values||[];return new tr(S,R)}(e.endAt)),Lh(t,i,c,o,l,"F",d,f)}function Ed(r,t){const e=function(i){switch(i){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return F(28987,{purpose:i})}}(t.purpose);return e==null?null:{"goog-listen-tags":e}}function rc(r){return r.unaryFilter!==void 0?function(e){switch(e.unaryFilter.op){case"IS_NAN":const n=Re(e.unaryFilter.field);return at.create(n,"==",{doubleValue:NaN});case"IS_NULL":const i=Re(e.unaryFilter.field);return at.create(i,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const o=Re(e.unaryFilter.field);return at.create(o,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const c=Re(e.unaryFilter.field);return at.create(c,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return F(61313);default:return F(60726)}}(r):r.fieldFilter!==void 0?function(e){return at.create(Re(e.fieldFilter.field),function(i){switch(i){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return F(58110);default:return F(50506)}}(e.fieldFilter.op),e.fieldFilter.value)}(r):r.compositeFilter!==void 0?function(e){return Ot.create(e.compositeFilter.filters.map(n=>rc(n)),function(i){switch(i){case"AND":return"and";case"OR":return"or";default:return F(1026)}}(e.compositeFilter.op))}(r):F(30097,{filter:r})}function Td(r){return ad[r]}function vd(r){return cd[r]}function Id(r){return ud[r]}function Ae(r){return{fieldPath:r.canonicalString()}}function Re(r){return It.fromServerFormat(r.fieldPath)}function sc(r){return r instanceof at?function(e){if(e.op==="=="){if(bo(e.value))return{unaryFilter:{field:Ae(e.field),op:"IS_NAN"}};if(Po(e.value))return{unaryFilter:{field:Ae(e.field),op:"IS_NULL"}}}else if(e.op==="!="){if(bo(e.value))return{unaryFilter:{field:Ae(e.field),op:"IS_NOT_NAN"}};if(Po(e.value))return{unaryFilter:{field:Ae(e.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:Ae(e.field),op:vd(e.op),value:e.value}}}(r):r instanceof Ot?function(e){const n=e.getFilters().map(i=>sc(i));return n.length===1?n[0]:{compositeFilter:{op:Id(e.op),filters:n}}}(r):F(54877,{filter:r})}function ic(r){return r.length>=4&&r.get(0)==="projects"&&r.get(2)==="databases"}/**
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
 */class Gt{constructor(t,e,n,i,o=L.min(),c=L.min(),l=mt.EMPTY_BYTE_STRING,d=null){this.target=t,this.targetId=e,this.purpose=n,this.sequenceNumber=i,this.snapshotVersion=o,this.lastLimboFreeSnapshotVersion=c,this.resumeToken=l,this.expectedCount=d}withSequenceNumber(t){return new Gt(this.target,this.targetId,this.purpose,t,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(t,e){return new Gt(this.target,this.targetId,this.purpose,this.sequenceNumber,e,this.lastLimboFreeSnapshotVersion,t,null)}withExpectedCount(t){return new Gt(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,t)}withLastLimboFreeSnapshotVersion(t){return new Gt(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,t,this.resumeToken,this.expectedCount)}}/**
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
 */class wd{constructor(t){this.yt=t}}function Ad(r){const t=yd({parent:r.parent,structuredQuery:r.structuredQuery});return r.limitType==="LAST"?_s(t,t.limit,"L"):t}/**
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
 */class Rd{constructor(){this.Cn=new Cd}addToCollectionParentIndex(t,e){return this.Cn.add(e),C.resolve()}getCollectionParents(t,e){return C.resolve(this.Cn.getEntries(e))}addFieldIndex(t,e){return C.resolve()}deleteFieldIndex(t,e){return C.resolve()}deleteAllFieldIndexes(t){return C.resolve()}createTargetIndexes(t,e){return C.resolve()}getDocumentsMatchingTarget(t,e){return C.resolve(null)}getIndexType(t,e){return C.resolve(0)}getFieldIndexes(t,e){return C.resolve([])}getNextCollectionGroupToUpdate(t){return C.resolve(null)}getMinOffset(t,e){return C.resolve(Jt.min())}getMinOffsetFromCollectionGroup(t,e){return C.resolve(Jt.min())}updateCollectionGroup(t,e,n){return C.resolve()}updateIndexEntries(t,e){return C.resolve()}}class Cd{constructor(){this.index={}}add(t){const e=t.lastSegment(),n=t.popLast(),i=this.index[e]||new ct(X.comparator),o=!i.has(n);return this.index[e]=i.add(n),o}has(t){const e=t.lastSegment(),n=t.popLast(),i=this.index[e];return i&&i.has(n)}getEntries(t){return(this.index[t]||new ct(X.comparator)).toArray()}}/**
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
 */const $o={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0},oc=41943040;class At{static withCacheSize(t){return new At(t,At.DEFAULT_COLLECTION_PERCENTILE,At.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(t,e,n){this.cacheSizeCollectionThreshold=t,this.percentileToCollect=e,this.maximumSequenceNumbersToCollect=n}}/**
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
 */At.DEFAULT_COLLECTION_PERCENTILE=10,At.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,At.DEFAULT=new At(oc,At.DEFAULT_COLLECTION_PERCENTILE,At.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),At.DISABLED=new At(-1,0,0);/**
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
 */class xe{constructor(t){this.ar=t}next(){return this.ar+=2,this.ar}static ur(){return new xe(0)}static cr(){return new xe(-1)}}/**
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
 */const zo="LruGarbageCollector",Sd=1048576;function Ho([r,t],[e,n]){const i=B(r,e);return i===0?B(t,n):i}class Pd{constructor(t){this.Ir=t,this.buffer=new ct(Ho),this.Er=0}dr(){return++this.Er}Ar(t){const e=[t,this.dr()];if(this.buffer.size<this.Ir)this.buffer=this.buffer.add(e);else{const n=this.buffer.last();Ho(e,n)<0&&(this.buffer=this.buffer.delete(n).add(e))}}get maxValue(){return this.buffer.last()[0]}}class bd{constructor(t,e,n){this.garbageCollector=t,this.asyncQueue=e,this.localStore=n,this.Rr=null}start(){this.garbageCollector.params.cacheSizeCollectionThreshold!==-1&&this.Vr(6e4)}stop(){this.Rr&&(this.Rr.cancel(),this.Rr=null)}get started(){return this.Rr!==null}Vr(t){V(zo,`Garbage collection scheduled in ${t}ms`),this.Rr=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",t,async()=>{this.Rr=null;try{await this.localStore.collectGarbage(this.garbageCollector)}catch(e){Fe(e)?V(zo,"Ignoring IndexedDB error during garbage collection: ",e):await or(e)}await this.Vr(3e5)})}}class Vd{constructor(t,e){this.mr=t,this.params=e}calculateTargetCount(t,e){return this.mr.gr(t).next(n=>Math.floor(e/100*n))}nthSequenceNumber(t,e){if(e===0)return C.resolve(ar.ce);const n=new Pd(e);return this.mr.forEachTarget(t,i=>n.Ar(i.sequenceNumber)).next(()=>this.mr.pr(t,i=>n.Ar(i))).next(()=>n.maxValue)}removeTargets(t,e,n){return this.mr.removeTargets(t,e,n)}removeOrphanedDocuments(t,e){return this.mr.removeOrphanedDocuments(t,e)}collect(t,e){return this.params.cacheSizeCollectionThreshold===-1?(V("LruGarbageCollector","Garbage collection skipped; disabled"),C.resolve($o)):this.getCacheSize(t).next(n=>n<this.params.cacheSizeCollectionThreshold?(V("LruGarbageCollector",`Garbage collection skipped; Cache size ${n} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),$o):this.yr(t,e))}getCacheSize(t){return this.mr.getCacheSize(t)}yr(t,e){let n,i,o,c,l,d,f;const _=Date.now();return this.calculateTargetCount(t,this.params.percentileToCollect).next(v=>(v>this.params.maximumSequenceNumbersToCollect?(V("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${v}`),i=this.params.maximumSequenceNumbersToCollect):i=v,c=Date.now(),this.nthSequenceNumber(t,i))).next(v=>(n=v,l=Date.now(),this.removeTargets(t,n,e))).next(v=>(o=v,d=Date.now(),this.removeOrphanedDocuments(t,n))).next(v=>(f=Date.now(),Ie()<=q.DEBUG&&V("LruGarbageCollector",`LRU Garbage Collection
	Counted targets in ${c-_}ms
	Determined least recently used ${i} in `+(l-c)+`ms
	Removed ${o} targets in `+(d-l)+`ms
	Removed ${v} documents in `+(f-d)+`ms
Total Duration: ${f-_}ms`),C.resolve({didRun:!0,sequenceNumbersCollected:i,targetsRemoved:o,documentsRemoved:v})))}}function Dd(r,t){return new Vd(r,t)}/**
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
 */class Nd{constructor(){this.changes=new pe(t=>t.toString(),(t,e)=>t.isEqual(e)),this.changesApplied=!1}addEntry(t){this.assertNotApplied(),this.changes.set(t.key,t)}removeEntry(t,e){this.assertNotApplied(),this.changes.set(t,Et.newInvalidDocument(t).setReadTime(e))}getEntry(t,e){this.assertNotApplied();const n=this.changes.get(e);return n!==void 0?C.resolve(n):this.getFromCache(t,e)}getEntries(t,e){return this.getAllFromCache(t,e)}apply(t){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(t)}assertNotApplied(){}}/**
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
 */class kd{constructor(t,e,n,i){this.remoteDocumentCache=t,this.mutationQueue=e,this.documentOverlayCache=n,this.indexManager=i}getDocument(t,e){let n=null;return this.documentOverlayCache.getOverlay(t,e).next(i=>(n=i,this.remoteDocumentCache.getEntry(t,e))).next(i=>(n!==null&&hn(n.mutation,i,Ht.empty(),st.now()),i))}getDocuments(t,e){return this.remoteDocumentCache.getEntries(t,e).next(n=>this.getLocalViewOfDocuments(t,n,z()).next(()=>n))}getLocalViewOfDocuments(t,e,n=z()){const i=le();return this.populateOverlays(t,i,e).next(()=>this.computeViews(t,e,i,n).next(o=>{let c=rn();return o.forEach((l,d)=>{c=c.insert(l,d.overlayedDocument)}),c}))}getOverlayedDocuments(t,e){const n=le();return this.populateOverlays(t,n,e).next(()=>this.computeViews(t,e,n,z()))}populateOverlays(t,e,n){const i=[];return n.forEach(o=>{e.has(o)||i.push(o)}),this.documentOverlayCache.getOverlays(t,i).next(o=>{o.forEach((c,l)=>{e.set(c,l)})})}computeViews(t,e,n,i){let o=ne();const c=ln(),l=function(){return ln()}();return e.forEach((d,f)=>{const _=n.get(f.key);i.has(f.key)&&(_===void 0||_.mutation instanceof mr)?o=o.insert(f.key,f):_!==void 0?(c.set(f.key,_.mutation.getFieldMask()),hn(_.mutation,f,_.mutation.getFieldMask(),st.now())):c.set(f.key,Ht.empty())}),this.recalculateAndSaveOverlays(t,o).next(d=>(d.forEach((f,_)=>c.set(f,_)),e.forEach((f,_)=>l.set(f,new xd(_,c.get(f)??null))),l))}recalculateAndSaveOverlays(t,e){const n=ln();let i=new nt((c,l)=>c-l),o=z();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(t,e).next(c=>{for(const l of c)l.keys().forEach(d=>{const f=e.get(d);if(f===null)return;let _=n.get(d)||Ht.empty();_=l.applyToLocalView(f,_),n.set(d,_);const v=(i.get(l.batchId)||z()).add(d);i=i.insert(l.batchId,v)})}).next(()=>{const c=[],l=i.getReverseIterator();for(;l.hasNext();){const d=l.getNext(),f=d.key,_=d.value,v=Ha();_.forEach(R=>{if(!o.has(R)){const S=Wa(e.get(R),n.get(R));S!==null&&v.set(R,S),o=o.add(R)}}),c.push(this.documentOverlayCache.saveOverlays(t,f,v))}return C.waitFor(c)}).next(()=>n)}recalculateAndSaveOverlaysForDocumentKeys(t,e){return this.remoteDocumentCache.getEntries(t,e).next(n=>this.recalculateAndSaveOverlays(t,n))}getDocumentsMatchingQuery(t,e,n,i){return function(c){return O.isDocumentKey(c.path)&&c.collectionGroup===null&&c.filters.length===0}(e)?this.getDocumentsMatchingDocumentQuery(t,e.path):Fh(e)?this.getDocumentsMatchingCollectionGroupQuery(t,e,n,i):this.getDocumentsMatchingCollectionQuery(t,e,n,i)}getNextDocuments(t,e,n,i){return this.remoteDocumentCache.getAllFromCollectionGroup(t,e,n,i).next(o=>{const c=i-o.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(t,e,n.largestBatchId,i-o.size):C.resolve(le());let l=pn,d=o;return c.next(f=>C.forEach(f,(_,v)=>(l<v.largestBatchId&&(l=v.largestBatchId),o.get(_)?C.resolve():this.remoteDocumentCache.getEntry(t,_).next(R=>{d=d.insert(_,R)}))).next(()=>this.populateOverlays(t,f,o)).next(()=>this.computeViews(t,d,f,z())).next(_=>({batchId:l,changes:$h(_)})))})}getDocumentsMatchingDocumentQuery(t,e){return this.getDocument(t,new O(e)).next(n=>{let i=rn();return n.isFoundDocument()&&(i=i.insert(n.key,n)),i})}getDocumentsMatchingCollectionGroupQuery(t,e,n,i){const o=e.collectionGroup;let c=rn();return this.indexManager.getCollectionParents(t,o).next(l=>C.forEach(l,d=>{const f=function(v,R){return new lr(R,null,v.explicitOrderBy.slice(),v.filters.slice(),v.limit,v.limitType,v.startAt,v.endAt)}(e,d.child(o));return this.getDocumentsMatchingCollectionQuery(t,f,n,i).next(_=>{_.forEach((v,R)=>{c=c.insert(v,R)})})}).next(()=>c))}getDocumentsMatchingCollectionQuery(t,e,n,i){let o;return this.documentOverlayCache.getOverlaysForCollection(t,e.path,n.largestBatchId).next(c=>(o=c,this.remoteDocumentCache.getDocumentsMatchingQuery(t,e,n,o,i))).next(c=>{o.forEach((d,f)=>{const _=f.getKey();c.get(_)===null&&(c=c.insert(_,Et.newInvalidDocument(_)))});let l=rn();return c.forEach((d,f)=>{const _=o.get(d);_!==void 0&&hn(_.mutation,f,Ht.empty(),st.now()),dr(e,f)&&(l=l.insert(d,f))}),l})}}/**
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
 */class Od{constructor(t){this.serializer=t,this.Lr=new Map,this.kr=new Map}getBundleMetadata(t,e){return C.resolve(this.Lr.get(e))}saveBundleMetadata(t,e){return this.Lr.set(e.id,function(i){return{id:i.id,version:i.version,createTime:Se(i.createTime)}}(e)),C.resolve()}getNamedQuery(t,e){return C.resolve(this.kr.get(e))}saveNamedQuery(t,e){return this.kr.set(e.name,function(i){return{name:i.name,query:Ad(i.bundledQuery),readTime:Se(i.readTime)}}(e)),C.resolve()}}/**
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
 */class Md{constructor(){this.overlays=new nt(O.comparator),this.qr=new Map}getOverlay(t,e){return C.resolve(this.overlays.get(e))}getOverlays(t,e){const n=le();return C.forEach(e,i=>this.getOverlay(t,i).next(o=>{o!==null&&n.set(i,o)})).next(()=>n)}saveOverlays(t,e,n){return n.forEach((i,o)=>{this.St(t,e,o)}),C.resolve()}removeOverlaysForBatchId(t,e,n){const i=this.qr.get(n);return i!==void 0&&(i.forEach(o=>this.overlays=this.overlays.remove(o)),this.qr.delete(n)),C.resolve()}getOverlaysForCollection(t,e,n){const i=le(),o=e.length+1,c=new O(e.child("")),l=this.overlays.getIteratorFrom(c);for(;l.hasNext();){const d=l.getNext().value,f=d.getKey();if(!e.isPrefixOf(f.path))break;f.path.length===o&&d.largestBatchId>n&&i.set(d.getKey(),d)}return C.resolve(i)}getOverlaysForCollectionGroup(t,e,n,i){let o=new nt((f,_)=>f-_);const c=this.overlays.getIterator();for(;c.hasNext();){const f=c.getNext().value;if(f.getKey().getCollectionGroup()===e&&f.largestBatchId>n){let _=o.get(f.largestBatchId);_===null&&(_=le(),o=o.insert(f.largestBatchId,_)),_.set(f.getKey(),f)}}const l=le(),d=o.getIterator();for(;d.hasNext()&&(d.getNext().value.forEach((f,_)=>l.set(f,_)),!(l.size()>=i)););return C.resolve(l)}St(t,e,n){const i=this.overlays.get(n.key);if(i!==null){const c=this.qr.get(i.largestBatchId).delete(n.key);this.qr.set(i.largestBatchId,c)}this.overlays=this.overlays.insert(n.key,new nd(e,n));let o=this.qr.get(e);o===void 0&&(o=z(),this.qr.set(e,o)),this.qr.set(e,o.add(n.key))}}/**
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
 */class Ld{constructor(){this.sessionToken=mt.EMPTY_BYTE_STRING}getSessionToken(t){return C.resolve(this.sessionToken)}setSessionToken(t,e){return this.sessionToken=e,C.resolve()}}/**
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
 */class Bs{constructor(){this.Qr=new ct(dt.$r),this.Ur=new ct(dt.Kr)}isEmpty(){return this.Qr.isEmpty()}addReference(t,e){const n=new dt(t,e);this.Qr=this.Qr.add(n),this.Ur=this.Ur.add(n)}Wr(t,e){t.forEach(n=>this.addReference(n,e))}removeReference(t,e){this.Gr(new dt(t,e))}zr(t,e){t.forEach(n=>this.removeReference(n,e))}jr(t){const e=new O(new X([])),n=new dt(e,t),i=new dt(e,t+1),o=[];return this.Ur.forEachInRange([n,i],c=>{this.Gr(c),o.push(c.key)}),o}Jr(){this.Qr.forEach(t=>this.Gr(t))}Gr(t){this.Qr=this.Qr.delete(t),this.Ur=this.Ur.delete(t)}Hr(t){const e=new O(new X([])),n=new dt(e,t),i=new dt(e,t+1);let o=z();return this.Ur.forEachInRange([n,i],c=>{o=o.add(c.key)}),o}containsKey(t){const e=new dt(t,0),n=this.Qr.firstAfterOrEqual(e);return n!==null&&t.isEqual(n.key)}}class dt{constructor(t,e){this.key=t,this.Yr=e}static $r(t,e){return O.comparator(t.key,e.key)||B(t.Yr,e.Yr)}static Kr(t,e){return B(t.Yr,e.Yr)||O.comparator(t.key,e.key)}}/**
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
 */class Fd{constructor(t,e){this.indexManager=t,this.referenceDelegate=e,this.mutationQueue=[],this.tr=1,this.Zr=new ct(dt.$r)}checkEmpty(t){return C.resolve(this.mutationQueue.length===0)}addMutationBatch(t,e,n,i){const o=this.tr;this.tr++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const c=new ed(o,e,n,i);this.mutationQueue.push(c);for(const l of i)this.Zr=this.Zr.add(new dt(l.key,o)),this.indexManager.addToCollectionParentIndex(t,l.key.path.popLast());return C.resolve(c)}lookupMutationBatch(t,e){return C.resolve(this.Xr(e))}getNextMutationBatchAfterBatchId(t,e){const n=e+1,i=this.ei(n),o=i<0?0:i;return C.resolve(this.mutationQueue.length>o?this.mutationQueue[o]:null)}getHighestUnacknowledgedBatchId(){return C.resolve(this.mutationQueue.length===0?ph:this.tr-1)}getAllMutationBatches(t){return C.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(t,e){const n=new dt(e,0),i=new dt(e,Number.POSITIVE_INFINITY),o=[];return this.Zr.forEachInRange([n,i],c=>{const l=this.Xr(c.Yr);o.push(l)}),C.resolve(o)}getAllMutationBatchesAffectingDocumentKeys(t,e){let n=new ct(B);return e.forEach(i=>{const o=new dt(i,0),c=new dt(i,Number.POSITIVE_INFINITY);this.Zr.forEachInRange([o,c],l=>{n=n.add(l.Yr)})}),C.resolve(this.ti(n))}getAllMutationBatchesAffectingQuery(t,e){const n=e.path,i=n.length+1;let o=n;O.isDocumentKey(o)||(o=o.child(""));const c=new dt(new O(o),0);let l=new ct(B);return this.Zr.forEachWhile(d=>{const f=d.key.path;return!!n.isPrefixOf(f)&&(f.length===i&&(l=l.add(d.Yr)),!0)},c),C.resolve(this.ti(l))}ti(t){const e=[];return t.forEach(n=>{const i=this.Xr(n);i!==null&&e.push(i)}),e}removeMutationBatch(t,e){Y(this.ni(e.batchId,"removed")===0,55003),this.mutationQueue.shift();let n=this.Zr;return C.forEach(e.mutations,i=>{const o=new dt(i.key,e.batchId);return n=n.delete(o),this.referenceDelegate.markPotentiallyOrphaned(t,i.key)}).next(()=>{this.Zr=n})}ir(t){}containsKey(t,e){const n=new dt(e,0),i=this.Zr.firstAfterOrEqual(n);return C.resolve(e.isEqual(i&&i.key))}performConsistencyCheck(t){return this.mutationQueue.length,C.resolve()}ni(t,e){return this.ei(t)}ei(t){return this.mutationQueue.length===0?0:t-this.mutationQueue[0].batchId}Xr(t){const e=this.ei(t);return e<0||e>=this.mutationQueue.length?null:this.mutationQueue[e]}}/**
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
 */class Ud{constructor(t){this.ri=t,this.docs=function(){return new nt(O.comparator)}(),this.size=0}setIndexManager(t){this.indexManager=t}addEntry(t,e){const n=e.key,i=this.docs.get(n),o=i?i.size:0,c=this.ri(e);return this.docs=this.docs.insert(n,{document:e.mutableCopy(),size:c}),this.size+=c-o,this.indexManager.addToCollectionParentIndex(t,n.path.popLast())}removeEntry(t){const e=this.docs.get(t);e&&(this.docs=this.docs.remove(t),this.size-=e.size)}getEntry(t,e){const n=this.docs.get(e);return C.resolve(n?n.document.mutableCopy():Et.newInvalidDocument(e))}getEntries(t,e){let n=ne();return e.forEach(i=>{const o=this.docs.get(i);n=n.insert(i,o?o.document.mutableCopy():Et.newInvalidDocument(i))}),C.resolve(n)}getDocumentsMatchingQuery(t,e,n,i){let o=ne();const c=e.path,l=new O(c.child("__id-9223372036854775808__")),d=this.docs.getIteratorFrom(l);for(;d.hasNext();){const{key:f,value:{document:_}}=d.getNext();if(!c.isPrefixOf(f.path))break;f.path.length>c.length+1||dh(hh(_),n)<=0||(i.has(_.key)||dr(e,_))&&(o=o.insert(_.key,_.mutableCopy()))}return C.resolve(o)}getAllFromCollectionGroup(t,e,n,i){F(9500)}ii(t,e){return C.forEach(this.docs,n=>e(n))}newChangeBuffer(t){return new Bd(this)}getSize(t){return C.resolve(this.size)}}class Bd extends Nd{constructor(t){super(),this.Nr=t}applyChanges(t){const e=[];return this.changes.forEach((n,i)=>{i.isValidDocument()?e.push(this.Nr.addEntry(t,i)):this.Nr.removeEntry(n)}),C.waitFor(e)}getFromCache(t,e){return this.Nr.getEntry(t,e)}getAllFromCache(t,e){return this.Nr.getEntries(t,e)}}/**
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
 */class jd{constructor(t){this.persistence=t,this.si=new pe(e=>ks(e),Os),this.lastRemoteSnapshotVersion=L.min(),this.highestTargetId=0,this.oi=0,this._i=new Bs,this.targetCount=0,this.ai=xe.ur()}forEachTarget(t,e){return this.si.forEach((n,i)=>e(i)),C.resolve()}getLastRemoteSnapshotVersion(t){return C.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(t){return C.resolve(this.oi)}allocateTargetId(t){return this.highestTargetId=this.ai.next(),C.resolve(this.highestTargetId)}setTargetsMetadata(t,e,n){return n&&(this.lastRemoteSnapshotVersion=n),e>this.oi&&(this.oi=e),C.resolve()}Pr(t){this.si.set(t.target,t);const e=t.targetId;e>this.highestTargetId&&(this.ai=new xe(e),this.highestTargetId=e),t.sequenceNumber>this.oi&&(this.oi=t.sequenceNumber)}addTargetData(t,e){return this.Pr(e),this.targetCount+=1,C.resolve()}updateTargetData(t,e){return this.Pr(e),C.resolve()}removeTargetData(t,e){return this.si.delete(e.target),this._i.jr(e.targetId),this.targetCount-=1,C.resolve()}removeTargets(t,e,n){let i=0;const o=[];return this.si.forEach((c,l)=>{l.sequenceNumber<=e&&n.get(l.targetId)===null&&(this.si.delete(c),o.push(this.removeMatchingKeysForTargetId(t,l.targetId)),i++)}),C.waitFor(o).next(()=>i)}getTargetCount(t){return C.resolve(this.targetCount)}getTargetData(t,e){const n=this.si.get(e)||null;return C.resolve(n)}addMatchingKeys(t,e,n){return this._i.Wr(e,n),C.resolve()}removeMatchingKeys(t,e,n){this._i.zr(e,n);const i=this.persistence.referenceDelegate,o=[];return i&&e.forEach(c=>{o.push(i.markPotentiallyOrphaned(t,c))}),C.waitFor(o)}removeMatchingKeysForTargetId(t,e){return this._i.jr(e),C.resolve()}getMatchingKeysForTargetId(t,e){const n=this._i.Hr(e);return C.resolve(n)}containsKey(t,e){return C.resolve(this._i.containsKey(e))}}/**
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
 */class ac{constructor(t,e){this.ui={},this.overlays={},this.ci=new ar(0),this.li=!1,this.li=!0,this.hi=new Ld,this.referenceDelegate=t(this),this.Pi=new jd(this),this.indexManager=new Rd,this.remoteDocumentCache=function(i){return new Ud(i)}(n=>this.referenceDelegate.Ti(n)),this.serializer=new wd(e),this.Ii=new Od(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.li=!1,Promise.resolve()}get started(){return this.li}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(t){return this.indexManager}getDocumentOverlayCache(t){let e=this.overlays[t.toKey()];return e||(e=new Md,this.overlays[t.toKey()]=e),e}getMutationQueue(t,e){let n=this.ui[t.toKey()];return n||(n=new Fd(e,this.referenceDelegate),this.ui[t.toKey()]=n),n}getGlobalsCache(){return this.hi}getTargetCache(){return this.Pi}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.Ii}runTransaction(t,e,n){V("MemoryPersistence","Starting transaction:",t);const i=new qd(this.ci.next());return this.referenceDelegate.Ei(),n(i).next(o=>this.referenceDelegate.di(i).next(()=>o)).toPromise().then(o=>(i.raiseOnCommittedEvent(),o))}Ai(t,e){return C.or(Object.values(this.ui).map(n=>()=>n.containsKey(t,e)))}}class qd extends mh{constructor(t){super(),this.currentSequenceNumber=t}}class js{constructor(t){this.persistence=t,this.Ri=new Bs,this.Vi=null}static mi(t){return new js(t)}get fi(){if(this.Vi)return this.Vi;throw F(60996)}addReference(t,e,n){return this.Ri.addReference(n,e),this.fi.delete(n.toString()),C.resolve()}removeReference(t,e,n){return this.Ri.removeReference(n,e),this.fi.add(n.toString()),C.resolve()}markPotentiallyOrphaned(t,e){return this.fi.add(e.toString()),C.resolve()}removeTarget(t,e){this.Ri.jr(e.targetId).forEach(i=>this.fi.add(i.toString()));const n=this.persistence.getTargetCache();return n.getMatchingKeysForTargetId(t,e.targetId).next(i=>{i.forEach(o=>this.fi.add(o.toString()))}).next(()=>n.removeTargetData(t,e))}Ei(){this.Vi=new Set}di(t){const e=this.persistence.getRemoteDocumentCache().newChangeBuffer();return C.forEach(this.fi,n=>{const i=O.fromPath(n);return this.gi(t,i).next(o=>{o||e.removeEntry(i,L.min())})}).next(()=>(this.Vi=null,e.apply(t)))}updateLimboDocument(t,e){return this.gi(t,e).next(n=>{n?this.fi.delete(e.toString()):this.fi.add(e.toString())})}Ti(t){return 0}gi(t,e){return C.or([()=>C.resolve(this.Ri.containsKey(e)),()=>this.persistence.getTargetCache().containsKey(t,e),()=>this.persistence.Ai(t,e)])}}class sr{constructor(t,e){this.persistence=t,this.pi=new pe(n=>_h(n.path),(n,i)=>n.isEqual(i)),this.garbageCollector=Dd(this,e)}static mi(t,e){return new sr(t,e)}Ei(){}di(t){return C.resolve()}forEachTarget(t,e){return this.persistence.getTargetCache().forEachTarget(t,e)}gr(t){const e=this.wr(t);return this.persistence.getTargetCache().getTargetCount(t).next(n=>e.next(i=>n+i))}wr(t){let e=0;return this.pr(t,n=>{e++}).next(()=>e)}pr(t,e){return C.forEach(this.pi,(n,i)=>this.br(t,n,i).next(o=>o?C.resolve():e(i)))}removeTargets(t,e,n){return this.persistence.getTargetCache().removeTargets(t,e,n)}removeOrphanedDocuments(t,e){let n=0;const i=this.persistence.getRemoteDocumentCache(),o=i.newChangeBuffer();return i.ii(t,c=>this.br(t,c,e).next(l=>{l||(n++,o.removeEntry(c,L.min()))})).next(()=>o.apply(t)).next(()=>n)}markPotentiallyOrphaned(t,e){return this.pi.set(e,t.currentSequenceNumber),C.resolve()}removeTarget(t,e){const n=e.withSequenceNumber(t.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(t,n)}addReference(t,e,n){return this.pi.set(n,t.currentSequenceNumber),C.resolve()}removeReference(t,e,n){return this.pi.set(n,t.currentSequenceNumber),C.resolve()}updateLimboDocument(t,e){return this.pi.set(e,t.currentSequenceNumber),C.resolve()}Ti(t){let e=t.key.toString().length;return t.isFoundDocument()&&(e+=Gn(t.data.value)),e}br(t,e,n){return C.or([()=>this.persistence.Ai(t,e),()=>this.persistence.getTargetCache().containsKey(t,e),()=>{const i=this.pi.get(e);return C.resolve(i!==void 0&&i>n)}])}getCacheSize(t){return this.persistence.getRemoteDocumentCache().getSize(t)}}/**
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
 */class qs{constructor(t,e,n,i){this.targetId=t,this.fromCache=e,this.Es=n,this.ds=i}static As(t,e){let n=z(),i=z();for(const o of e.docChanges)switch(o.type){case 0:n=n.add(o.doc.key);break;case 1:i=i.add(o.doc.key)}return new qs(t,e.fromCache,n,i)}}/**
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
 */class $d{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(t){this._documentReadCount+=t}}/**
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
 */class zd{constructor(){this.Rs=!1,this.Vs=!1,this.fs=100,this.gs=function(){return bu()?8:gh(Su())>0?6:4}()}initialize(t,e){this.ps=t,this.indexManager=e,this.Rs=!0}getDocumentsMatchingQuery(t,e,n,i){const o={result:null};return this.ys(t,e).next(c=>{o.result=c}).next(()=>{if(!o.result)return this.ws(t,e,i,n).next(c=>{o.result=c})}).next(()=>{if(o.result)return;const c=new $d;return this.Ss(t,e,c).next(l=>{if(o.result=l,this.Vs)return this.bs(t,e,c,l.size)})}).next(()=>o.result)}bs(t,e,n,i){return n.documentReadCount<this.fs?(Ie()<=q.DEBUG&&V("QueryEngine","SDK will not create cache indexes for query:",we(e),"since it only creates cache indexes for collection contains","more than or equal to",this.fs,"documents"),C.resolve()):(Ie()<=q.DEBUG&&V("QueryEngine","Query:",we(e),"scans",n.documentReadCount,"local documents and returns",i,"documents as results."),n.documentReadCount>this.gs*i?(Ie()<=q.DEBUG&&V("QueryEngine","The SDK decides to create cache indexes for query:",we(e),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(t,xt(e))):C.resolve())}ys(t,e){if(xo(e))return C.resolve(null);let n=xt(e);return this.indexManager.getIndexType(t,n).next(i=>i===0?null:(e.limit!==null&&i===1&&(e=_s(e,null,"F"),n=xt(e)),this.indexManager.getDocumentsMatchingTarget(t,n).next(o=>{const c=z(...o);return this.ps.getDocuments(t,c).next(l=>this.indexManager.getMinOffset(t,n).next(d=>{const f=this.Ds(e,l);return this.Cs(e,f,c,d.readTime)?this.ys(t,_s(e,null,"F")):this.vs(t,f,e,d)}))})))}ws(t,e,n,i){return xo(e)||i.isEqual(L.min())?C.resolve(null):this.ps.getDocuments(t,n).next(o=>{const c=this.Ds(e,o);return this.Cs(e,c,n,i)?C.resolve(null):(Ie()<=q.DEBUG&&V("QueryEngine","Re-using previous result from %s to execute query: %s",i.toString(),we(e)),this.vs(t,c,e,lh(i,pn)).next(l=>l))})}Ds(t,e){let n=new ct($a(t));return e.forEach((i,o)=>{dr(t,o)&&(n=n.add(o))}),n}Cs(t,e,n,i){if(t.limit===null)return!1;if(n.size!==e.size)return!0;const o=t.limitType==="F"?e.last():e.first();return!!o&&(o.hasPendingWrites||o.version.compareTo(i)>0)}Ss(t,e,n){return Ie()<=q.DEBUG&&V("QueryEngine","Using full collection scan to execute query:",we(e)),this.ps.getDocumentsMatchingQuery(t,e,Jt.min(),n)}vs(t,e,n,i){return this.ps.getDocumentsMatchingQuery(t,n,i).next(o=>(e.forEach(c=>{o=o.insert(c.key,c)}),o))}}/**
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
 */const $s="LocalStore",Hd=3e8;class Gd{constructor(t,e,n,i){this.persistence=t,this.Fs=e,this.serializer=i,this.Ms=new nt(B),this.xs=new pe(o=>ks(o),Os),this.Os=new Map,this.Ns=t.getRemoteDocumentCache(),this.Pi=t.getTargetCache(),this.Ii=t.getBundleCache(),this.Bs(n)}Bs(t){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(t),this.indexManager=this.persistence.getIndexManager(t),this.mutationQueue=this.persistence.getMutationQueue(t,this.indexManager),this.localDocuments=new kd(this.Ns,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.Ns.setIndexManager(this.indexManager),this.Fs.initialize(this.localDocuments,this.indexManager)}collectGarbage(t){return this.persistence.runTransaction("Collect garbage","readwrite-primary",e=>t.collect(e,this.Ms))}}function Kd(r,t,e,n){return new Gd(r,t,e,n)}async function cc(r,t){const e=$(r);return await e.persistence.runTransaction("Handle user change","readonly",n=>{let i;return e.mutationQueue.getAllMutationBatches(n).next(o=>(i=o,e.Bs(t),e.mutationQueue.getAllMutationBatches(n))).next(o=>{const c=[],l=[];let d=z();for(const f of i){c.push(f.batchId);for(const _ of f.mutations)d=d.add(_.key)}for(const f of o){l.push(f.batchId);for(const _ of f.mutations)d=d.add(_.key)}return e.localDocuments.getDocuments(n,d).next(f=>({Ls:f,removedBatchIds:c,addedBatchIds:l}))})})}function uc(r){const t=$(r);return t.persistence.runTransaction("Get last remote snapshot version","readonly",e=>t.Pi.getLastRemoteSnapshotVersion(e))}function Qd(r,t){const e=$(r),n=t.snapshotVersion;let i=e.Ms;return e.persistence.runTransaction("Apply remote event","readwrite-primary",o=>{const c=e.Ns.newChangeBuffer({trackRemovals:!0});i=e.Ms;const l=[];t.targetChanges.forEach((_,v)=>{const R=i.get(v);if(!R)return;l.push(e.Pi.removeMatchingKeys(o,_.removedDocuments,v).next(()=>e.Pi.addMatchingKeys(o,_.addedDocuments,v)));let S=R.withSequenceNumber(o.currentSequenceNumber);t.targetMismatches.get(v)!==null?S=S.withResumeToken(mt.EMPTY_BYTE_STRING,L.min()).withLastLimboFreeSnapshotVersion(L.min()):_.resumeToken.approximateByteSize()>0&&(S=S.withResumeToken(_.resumeToken,n)),i=i.insert(v,S),function(M,D,Q){return M.resumeToken.approximateByteSize()===0||D.snapshotVersion.toMicroseconds()-M.snapshotVersion.toMicroseconds()>=Hd?!0:Q.addedDocuments.size+Q.modifiedDocuments.size+Q.removedDocuments.size>0}(R,S,_)&&l.push(e.Pi.updateTargetData(o,S))});let d=ne(),f=z();if(t.documentUpdates.forEach(_=>{t.resolvedLimboDocuments.has(_)&&l.push(e.persistence.referenceDelegate.updateLimboDocument(o,_))}),l.push(Wd(o,c,t.documentUpdates).next(_=>{d=_.ks,f=_.qs})),!n.isEqual(L.min())){const _=e.Pi.getLastRemoteSnapshotVersion(o).next(v=>e.Pi.setTargetsMetadata(o,o.currentSequenceNumber,n));l.push(_)}return C.waitFor(l).next(()=>c.apply(o)).next(()=>e.localDocuments.getLocalViewOfDocuments(o,d,f)).next(()=>d)}).then(o=>(e.Ms=i,o))}function Wd(r,t,e){let n=z(),i=z();return e.forEach(o=>n=n.add(o)),t.getEntries(r,n).next(o=>{let c=ne();return e.forEach((l,d)=>{const f=o.get(l);d.isFoundDocument()!==f.isFoundDocument()&&(i=i.add(l)),d.isNoDocument()&&d.version.isEqual(L.min())?(t.removeEntry(l,d.readTime),c=c.insert(l,d)):!f.isValidDocument()||d.version.compareTo(f.version)>0||d.version.compareTo(f.version)===0&&f.hasPendingWrites?(t.addEntry(d),c=c.insert(l,d)):V($s,"Ignoring outdated watch update for ",l,". Current version:",f.version," Watch version:",d.version)}),{ks:c,qs:i}})}function Xd(r,t){const e=$(r);return e.persistence.runTransaction("Allocate target","readwrite",n=>{let i;return e.Pi.getTargetData(n,t).next(o=>o?(i=o,C.resolve(i)):e.Pi.allocateTargetId(n).next(c=>(i=new Gt(t,c,"TargetPurposeListen",n.currentSequenceNumber),e.Pi.addTargetData(n,i).next(()=>i))))}).then(n=>{const i=e.Ms.get(n.targetId);return(i===null||n.snapshotVersion.compareTo(i.snapshotVersion)>0)&&(e.Ms=e.Ms.insert(n.targetId,n),e.xs.set(t,n.targetId)),n})}async function Is(r,t,e){const n=$(r),i=n.Ms.get(t),o=e?"readwrite":"readwrite-primary";try{e||await n.persistence.runTransaction("Release target",o,c=>n.persistence.referenceDelegate.removeTarget(c,i))}catch(c){if(!Fe(c))throw c;V($s,`Failed to update sequence numbers for target ${t}: ${c}`)}n.Ms=n.Ms.remove(t),n.xs.delete(i.target)}function Go(r,t,e){const n=$(r);let i=L.min(),o=z();return n.persistence.runTransaction("Execute query","readwrite",c=>function(d,f,_){const v=$(d),R=v.xs.get(_);return R!==void 0?C.resolve(v.Ms.get(R)):v.Pi.getTargetData(f,_)}(n,c,xt(t)).next(l=>{if(l)return i=l.lastLimboFreeSnapshotVersion,n.Pi.getMatchingKeysForTargetId(c,l.targetId).next(d=>{o=d})}).next(()=>n.Fs.getDocumentsMatchingQuery(c,t,e?i:L.min(),e?o:z())).next(l=>(Yd(n,Bh(t),l),{documents:l,Qs:o})))}function Yd(r,t,e){let n=r.Os.get(t)||L.min();e.forEach((i,o)=>{o.readTime.compareTo(n)>0&&(n=o.readTime)}),r.Os.set(t,n)}class Ko{constructor(){this.activeTargetIds=Gh()}zs(t){this.activeTargetIds=this.activeTargetIds.add(t)}js(t){this.activeTargetIds=this.activeTargetIds.delete(t)}Gs(){const t={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(t)}}class Jd{constructor(){this.Mo=new Ko,this.xo={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(t){}updateMutationState(t,e,n){}addLocalQueryTarget(t,e=!0){return e&&this.Mo.zs(t),this.xo[t]||"not-current"}updateQueryState(t,e,n){this.xo[t]=e}removeLocalQueryTarget(t){this.Mo.js(t)}isLocalQueryTarget(t){return this.Mo.activeTargetIds.has(t)}clearQueryState(t){delete this.xo[t]}getAllActiveQueryTargets(){return this.Mo.activeTargetIds}isActiveQueryTarget(t){return this.Mo.activeTargetIds.has(t)}start(){return this.Mo=new Ko,Promise.resolve()}handleUserChange(t,e,n){}setOnlineState(t){}shutdown(){}writeSequenceNumber(t){}notifyBundleLoaded(t){}}/**
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
 */class Zd{Oo(t){}shutdown(){}}/**
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
 */const Qo="ConnectivityMonitor";class Wo{constructor(){this.No=()=>this.Bo(),this.Lo=()=>this.ko(),this.qo=[],this.Qo()}Oo(t){this.qo.push(t)}shutdown(){window.removeEventListener("online",this.No),window.removeEventListener("offline",this.Lo)}Qo(){window.addEventListener("online",this.No),window.addEventListener("offline",this.Lo)}Bo(){V(Qo,"Network connectivity changed: AVAILABLE");for(const t of this.qo)t(0)}ko(){V(Qo,"Network connectivity changed: UNAVAILABLE");for(const t of this.qo)t(1)}static v(){return typeof window<"u"&&window.addEventListener!==void 0&&window.removeEventListener!==void 0}}/**
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
 */let zn=null;function ws(){return zn===null?zn=function(){return 268435456+Math.round(2147483648*Math.random())}():zn++,"0x"+zn.toString(16)}/**
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
 */const Qr="RestConnection",tf={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery"};class ef{get $o(){return!1}constructor(t){this.databaseInfo=t,this.databaseId=t.databaseId;const e=t.ssl?"https":"http",n=encodeURIComponent(this.databaseId.projectId),i=encodeURIComponent(this.databaseId.database);this.Uo=e+"://"+t.host,this.Ko=`projects/${n}/databases/${i}`,this.Wo=this.databaseId.database===Zn?`project_id=${n}`:`project_id=${n}&database_id=${i}`}Go(t,e,n,i,o){const c=ws(),l=this.zo(t,e.toUriEncodedString());V(Qr,`Sending RPC '${t}' ${c}:`,l,n);const d={"google-cloud-resource-prefix":this.Ko,"x-goog-request-params":this.Wo};this.jo(d,i,o);const{host:f}=new URL(l),_=Ps(f);return this.Jo(t,l,d,n,_).then(v=>(V(Qr,`Received RPC '${t}' ${c}: `,v),v),v=>{throw be(Qr,`RPC '${t}' ${c} failed with error: `,v,"url: ",l,"request:",n),v})}Ho(t,e,n,i,o,c){return this.Go(t,e,n,i,o)}jo(t,e,n){t["X-Goog-Api-Client"]=function(){return"gl-js/ fire/"+Le}(),t["Content-Type"]="text/plain",this.databaseInfo.appId&&(t["X-Firebase-GMPID"]=this.databaseInfo.appId),e&&e.headers.forEach((i,o)=>t[o]=i),n&&n.headers.forEach((i,o)=>t[o]=i)}zo(t,e){const n=tf[t];return`${this.Uo}/v1/${e}:${n}`}terminate(){}}/**
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
 */class nf{constructor(t){this.Yo=t.Yo,this.Zo=t.Zo}Xo(t){this.e_=t}t_(t){this.n_=t}r_(t){this.i_=t}onMessage(t){this.s_=t}close(){this.Zo()}send(t){this.Yo(t)}o_(){this.e_()}__(){this.n_()}a_(t){this.i_(t)}u_(t){this.s_(t)}}/**
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
 */const _t="WebChannelConnection";class rf extends ef{constructor(t){super(t),this.c_=[],this.forceLongPolling=t.forceLongPolling,this.autoDetectLongPolling=t.autoDetectLongPolling,this.useFetchStreams=t.useFetchStreams,this.longPollingOptions=t.longPollingOptions}Jo(t,e,n,i,o){const c=ws();return new Promise((l,d)=>{const f=new wa;f.setWithCredentials(!0),f.listenOnce(Aa.COMPLETE,()=>{try{switch(f.getLastErrorCode()){case Hn.NO_ERROR:const v=f.getResponseJson();V(_t,`XHR for RPC '${t}' ${c} received:`,JSON.stringify(v)),l(v);break;case Hn.TIMEOUT:V(_t,`RPC '${t}' ${c} timed out`),d(new x(P.DEADLINE_EXCEEDED,"Request time out"));break;case Hn.HTTP_ERROR:const R=f.getStatus();if(V(_t,`RPC '${t}' ${c} failed with status:`,R,"response text:",f.getResponseText()),R>0){let S=f.getResponseJson();Array.isArray(S)&&(S=S[0]);const N=S==null?void 0:S.error;if(N&&N.status&&N.message){const M=function(Q){const H=Q.toLowerCase().replace(/_/g,"-");return Object.values(P).indexOf(H)>=0?H:P.UNKNOWN}(N.status);d(new x(M,N.message))}else d(new x(P.UNKNOWN,"Server responded with status "+f.getStatus()))}else d(new x(P.UNAVAILABLE,"Connection failed."));break;default:F(9055,{l_:t,streamId:c,h_:f.getLastErrorCode(),P_:f.getLastError()})}}finally{V(_t,`RPC '${t}' ${c} completed.`)}});const _=JSON.stringify(i);V(_t,`RPC '${t}' ${c} sending request:`,i),f.send(e,"POST",_,n,15)})}T_(t,e,n){const i=ws(),o=[this.Uo,"/","google.firestore.v1.Firestore","/",t,"/channel"],c=Sa(),l=Ca(),d={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},f=this.longPollingOptions.timeoutSeconds;f!==void 0&&(d.longPollingTimeout=Math.round(1e3*f)),this.useFetchStreams&&(d.useFetchStreams=!0),this.jo(d.initMessageHeaders,e,n),d.encodeInitMessageHeaders=!0;const _=o.join("");V(_t,`Creating RPC '${t}' stream ${i}: ${_}`,d);const v=c.createWebChannel(_,d);this.I_(v);let R=!1,S=!1;const N=new nf({Yo:D=>{S?V(_t,`Not sending because RPC '${t}' stream ${i} is closed:`,D):(R||(V(_t,`Opening RPC '${t}' stream ${i} transport.`),v.open(),R=!0),V(_t,`RPC '${t}' stream ${i} sending:`,D),v.send(D))},Zo:()=>v.close()}),M=(D,Q,H)=>{D.listen(Q,G=>{try{H(G)}catch(tt){setTimeout(()=>{throw tt},0)}})};return M(v,nn.EventType.OPEN,()=>{S||(V(_t,`RPC '${t}' stream ${i} transport opened.`),N.o_())}),M(v,nn.EventType.CLOSE,()=>{S||(S=!0,V(_t,`RPC '${t}' stream ${i} transport closed`),N.a_(),this.E_(v))}),M(v,nn.EventType.ERROR,D=>{S||(S=!0,be(_t,`RPC '${t}' stream ${i} transport errored. Name:`,D.name,"Message:",D.message),N.a_(new x(P.UNAVAILABLE,"The operation could not be completed")))}),M(v,nn.EventType.MESSAGE,D=>{var Q;if(!S){const H=D.data[0];Y(!!H,16349);const G=H,tt=(G==null?void 0:G.error)||((Q=G[0])==null?void 0:Q.error);if(tt){V(_t,`RPC '${t}' stream ${i} received error:`,tt);const gt=tt.status;let J=function(p){const T=rt[p];if(T!==void 0)return Ya(T)}(gt),E=tt.message;J===void 0&&(J=P.INTERNAL,E="Unknown error status: "+gt+" with message "+tt.message),S=!0,N.a_(new x(J,E)),v.close()}else V(_t,`RPC '${t}' stream ${i} received:`,H),N.u_(H)}}),M(l,Ra.STAT_EVENT,D=>{D.stat===cs.PROXY?V(_t,`RPC '${t}' stream ${i} detected buffering proxy`):D.stat===cs.NOPROXY&&V(_t,`RPC '${t}' stream ${i} detected no buffering proxy`)}),setTimeout(()=>{N.__()},0),N}terminate(){this.c_.forEach(t=>t.close()),this.c_=[]}I_(t){this.c_.push(t)}E_(t){this.c_=this.c_.filter(e=>e===t)}}function Wr(){return typeof document<"u"?document:null}/**
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
 */function lc(r){return new ld(r,!0)}/**
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
 */class hc{constructor(t,e,n=1e3,i=1.5,o=6e4){this.Mi=t,this.timerId=e,this.d_=n,this.A_=i,this.R_=o,this.V_=0,this.m_=null,this.f_=Date.now(),this.reset()}reset(){this.V_=0}g_(){this.V_=this.R_}p_(t){this.cancel();const e=Math.floor(this.V_+this.y_()),n=Math.max(0,Date.now()-this.f_),i=Math.max(0,e-n);i>0&&V("ExponentialBackoff",`Backing off for ${i} ms (base delay: ${this.V_} ms, delay with jitter: ${e} ms, last attempt: ${n} ms ago)`),this.m_=this.Mi.enqueueAfterDelay(this.timerId,i,()=>(this.f_=Date.now(),t())),this.V_*=this.A_,this.V_<this.d_&&(this.V_=this.d_),this.V_>this.R_&&(this.V_=this.R_)}w_(){this.m_!==null&&(this.m_.skipDelay(),this.m_=null)}cancel(){this.m_!==null&&(this.m_.cancel(),this.m_=null)}y_(){return(Math.random()-.5)*this.V_}}/**
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
 */const Xo="PersistentStream";class sf{constructor(t,e,n,i,o,c,l,d){this.Mi=t,this.S_=n,this.b_=i,this.connection=o,this.authCredentialsProvider=c,this.appCheckCredentialsProvider=l,this.listener=d,this.state=0,this.D_=0,this.C_=null,this.v_=null,this.stream=null,this.F_=0,this.M_=new hc(t,e)}x_(){return this.state===1||this.state===5||this.O_()}O_(){return this.state===2||this.state===3}start(){this.F_=0,this.state!==4?this.auth():this.N_()}async stop(){this.x_()&&await this.close(0)}B_(){this.state=0,this.M_.reset()}L_(){this.O_()&&this.C_===null&&(this.C_=this.Mi.enqueueAfterDelay(this.S_,6e4,()=>this.k_()))}q_(t){this.Q_(),this.stream.send(t)}async k_(){if(this.O_())return this.close(0)}Q_(){this.C_&&(this.C_.cancel(),this.C_=null)}U_(){this.v_&&(this.v_.cancel(),this.v_=null)}async close(t,e){this.Q_(),this.U_(),this.M_.cancel(),this.D_++,t!==4?this.M_.reset():e&&e.code===P.RESOURCE_EXHAUSTED?(Ft(e.toString()),Ft("Using maximum backoff delay to prevent overloading the backend."),this.M_.g_()):e&&e.code===P.UNAUTHENTICATED&&this.state!==3&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),this.stream!==null&&(this.K_(),this.stream.close(),this.stream=null),this.state=t,await this.listener.r_(e)}K_(){}auth(){this.state=1;const t=this.W_(this.D_),e=this.D_;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then(([n,i])=>{this.D_===e&&this.G_(n,i)},n=>{t(()=>{const i=new x(P.UNKNOWN,"Fetching auth token failed: "+n.message);return this.z_(i)})})}G_(t,e){const n=this.W_(this.D_);this.stream=this.j_(t,e),this.stream.Xo(()=>{n(()=>this.listener.Xo())}),this.stream.t_(()=>{n(()=>(this.state=2,this.v_=this.Mi.enqueueAfterDelay(this.b_,1e4,()=>(this.O_()&&(this.state=3),Promise.resolve())),this.listener.t_()))}),this.stream.r_(i=>{n(()=>this.z_(i))}),this.stream.onMessage(i=>{n(()=>++this.F_==1?this.J_(i):this.onNext(i))})}N_(){this.state=5,this.M_.p_(async()=>{this.state=0,this.start()})}z_(t){return V(Xo,`close with error: ${t}`),this.stream=null,this.close(4,t)}W_(t){return e=>{this.Mi.enqueueAndForget(()=>this.D_===t?e():(V(Xo,"stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve()))}}}class of extends sf{constructor(t,e,n,i,o,c){super(t,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",e,n,i,c),this.serializer=o}j_(t,e){return this.connection.T_("Listen",t,e)}J_(t){return this.onNext(t)}onNext(t){this.M_.reset();const e=gd(this.serializer,t),n=function(o){if(!("targetChange"in o))return L.min();const c=o.targetChange;return c.targetIds&&c.targetIds.length?L.min():c.readTime?Se(c.readTime):L.min()}(t);return this.listener.H_(e,n)}Y_(t){const e={};e.database=qo(this.serializer),e.addTarget=function(o,c){let l;const d=c.target;if(l=ps(d)?{documents:pd(o,d)}:{query:_d(o,d).ft},l.targetId=c.targetId,c.resumeToken.approximateByteSize()>0){l.resumeToken=dd(o,c.resumeToken);const f=Ts(o,c.expectedCount);f!==null&&(l.expectedCount=f)}else if(c.snapshotVersion.compareTo(L.min())>0){l.readTime=hd(o,c.snapshotVersion.toTimestamp());const f=Ts(o,c.expectedCount);f!==null&&(l.expectedCount=f)}return l}(this.serializer,t);const n=Ed(this.serializer,t);n&&(e.labels=n),this.q_(e)}Z_(t){const e={};e.database=qo(this.serializer),e.removeTarget=t,this.q_(e)}}/**
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
 */class af{}class cf extends af{constructor(t,e,n,i){super(),this.authCredentials=t,this.appCheckCredentials=e,this.connection=n,this.serializer=i,this.ia=!1}sa(){if(this.ia)throw new x(P.FAILED_PRECONDITION,"The client has already been terminated.")}Go(t,e,n,i){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([o,c])=>this.connection.Go(t,vs(e,n),i,o,c)).catch(o=>{throw o.name==="FirebaseError"?(o.code===P.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),o):new x(P.UNKNOWN,o.toString())})}Ho(t,e,n,i,o){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([c,l])=>this.connection.Ho(t,vs(e,n),i,c,l,o)).catch(c=>{throw c.name==="FirebaseError"?(c.code===P.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),c):new x(P.UNKNOWN,c.toString())})}terminate(){this.ia=!0,this.connection.terminate()}}class uf{constructor(t,e){this.asyncQueue=t,this.onlineStateHandler=e,this.state="Unknown",this.oa=0,this._a=null,this.aa=!0}ua(){this.oa===0&&(this.ca("Unknown"),this._a=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,()=>(this._a=null,this.la("Backend didn't respond within 10 seconds."),this.ca("Offline"),Promise.resolve())))}ha(t){this.state==="Online"?this.ca("Unknown"):(this.oa++,this.oa>=1&&(this.Pa(),this.la(`Connection failed 1 times. Most recent error: ${t.toString()}`),this.ca("Offline")))}set(t){this.Pa(),this.oa=0,t==="Online"&&(this.aa=!1),this.ca(t)}ca(t){t!==this.state&&(this.state=t,this.onlineStateHandler(t))}la(t){const e=`Could not reach Cloud Firestore backend. ${t}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.aa?(Ft(e),this.aa=!1):V("OnlineStateTracker",e)}Pa(){this._a!==null&&(this._a.cancel(),this._a=null)}}/**
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
 */const ke="RemoteStore";class lf{constructor(t,e,n,i,o){this.localStore=t,this.datastore=e,this.asyncQueue=n,this.remoteSyncer={},this.Ta=[],this.Ia=new Map,this.Ea=new Set,this.da=[],this.Aa=o,this.Aa.Oo(c=>{n.enqueueAndForget(async()=>{Rn(this)&&(V(ke,"Restarting streams for network reachability change."),await async function(d){const f=$(d);f.Ea.add(4),await An(f),f.Ra.set("Unknown"),f.Ea.delete(4),await pr(f)}(this))})}),this.Ra=new uf(n,i)}}async function pr(r){if(Rn(r))for(const t of r.da)await t(!0)}async function An(r){for(const t of r.da)await t(!1)}function dc(r,t){const e=$(r);e.Ia.has(t.targetId)||(e.Ia.set(t.targetId,t),Ks(e)?Gs(e):Ue(e).O_()&&Hs(e,t))}function zs(r,t){const e=$(r),n=Ue(e);e.Ia.delete(t),n.O_()&&fc(e,t),e.Ia.size===0&&(n.O_()?n.L_():Rn(e)&&e.Ra.set("Unknown"))}function Hs(r,t){if(r.Va.Ue(t.targetId),t.resumeToken.approximateByteSize()>0||t.snapshotVersion.compareTo(L.min())>0){const e=r.remoteSyncer.getRemoteKeysForTarget(t.targetId).size;t=t.withExpectedCount(e)}Ue(r).Y_(t)}function fc(r,t){r.Va.Ue(t),Ue(r).Z_(t)}function Gs(r){r.Va=new od({getRemoteKeysForTarget:t=>r.remoteSyncer.getRemoteKeysForTarget(t),At:t=>r.Ia.get(t)||null,ht:()=>r.datastore.serializer.databaseId}),Ue(r).start(),r.Ra.ua()}function Ks(r){return Rn(r)&&!Ue(r).x_()&&r.Ia.size>0}function Rn(r){return $(r).Ea.size===0}function mc(r){r.Va=void 0}async function hf(r){r.Ra.set("Online")}async function df(r){r.Ia.forEach((t,e)=>{Hs(r,t)})}async function ff(r,t){mc(r),Ks(r)?(r.Ra.ha(t),Gs(r)):r.Ra.set("Unknown")}async function mf(r,t,e){if(r.Ra.set("Online"),t instanceof Za&&t.state===2&&t.cause)try{await async function(i,o){const c=o.cause;for(const l of o.targetIds)i.Ia.has(l)&&(await i.remoteSyncer.rejectListen(l,c),i.Ia.delete(l),i.Va.removeTarget(l))}(r,t)}catch(n){V(ke,"Failed to remove targets %s: %s ",t.targetIds.join(","),n),await Yo(r,n)}else if(t instanceof Qn?r.Va.Ze(t):t instanceof Ja?r.Va.st(t):r.Va.tt(t),!e.isEqual(L.min()))try{const n=await uc(r.localStore);e.compareTo(n)>=0&&await function(o,c){const l=o.Va.Tt(c);return l.targetChanges.forEach((d,f)=>{if(d.resumeToken.approximateByteSize()>0){const _=o.Ia.get(f);_&&o.Ia.set(f,_.withResumeToken(d.resumeToken,c))}}),l.targetMismatches.forEach((d,f)=>{const _=o.Ia.get(d);if(!_)return;o.Ia.set(d,_.withResumeToken(mt.EMPTY_BYTE_STRING,_.snapshotVersion)),fc(o,d);const v=new Gt(_.target,d,f,_.sequenceNumber);Hs(o,v)}),o.remoteSyncer.applyRemoteEvent(l)}(r,e)}catch(n){V(ke,"Failed to raise snapshot:",n),await Yo(r,n)}}async function Yo(r,t,e){if(!Fe(t))throw t;r.Ea.add(1),await An(r),r.Ra.set("Offline"),e||(e=()=>uc(r.localStore)),r.asyncQueue.enqueueRetryable(async()=>{V(ke,"Retrying IndexedDB access"),await e(),r.Ea.delete(1),await pr(r)})}async function Jo(r,t){const e=$(r);e.asyncQueue.verifyOperationInProgress(),V(ke,"RemoteStore received new credentials");const n=Rn(e);e.Ea.add(3),await An(e),n&&e.Ra.set("Unknown"),await e.remoteSyncer.handleCredentialChange(t),e.Ea.delete(3),await pr(e)}async function gf(r,t){const e=$(r);t?(e.Ea.delete(2),await pr(e)):t||(e.Ea.add(2),await An(e),e.Ra.set("Unknown"))}function Ue(r){return r.ma||(r.ma=function(e,n,i){const o=$(e);return o.sa(),new of(n,o.connection,o.authCredentials,o.appCheckCredentials,o.serializer,i)}(r.datastore,r.asyncQueue,{Xo:hf.bind(null,r),t_:df.bind(null,r),r_:ff.bind(null,r),H_:mf.bind(null,r)}),r.da.push(async t=>{t?(r.ma.B_(),Ks(r)?Gs(r):r.Ra.set("Unknown")):(await r.ma.stop(),mc(r))})),r.ma}/**
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
 */class Qs{constructor(t,e,n,i,o){this.asyncQueue=t,this.timerId=e,this.targetTimeMs=n,this.op=i,this.removalCallback=o,this.deferred=new he,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch(c=>{})}get promise(){return this.deferred.promise}static createAndSchedule(t,e,n,i,o){const c=Date.now()+n,l=new Qs(t,e,c,i,o);return l.start(n),l}start(t){this.timerHandle=setTimeout(()=>this.handleDelayElapsed(),t)}skipDelay(){return this.handleDelayElapsed()}cancel(t){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new x(P.CANCELLED,"Operation cancelled"+(t?": "+t:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget(()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then(t=>this.deferred.resolve(t))):Promise.resolve())}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function gc(r,t){if(Ft("AsyncQueue",`${t}: ${r}`),Fe(r))return new x(P.UNAVAILABLE,`${t}: ${r}`);throw r}/**
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
 */class Pe{static emptySet(t){return new Pe(t.comparator)}constructor(t){this.comparator=t?(e,n)=>t(e,n)||O.comparator(e.key,n.key):(e,n)=>O.comparator(e.key,n.key),this.keyedMap=rn(),this.sortedSet=new nt(this.comparator)}has(t){return this.keyedMap.get(t)!=null}get(t){return this.keyedMap.get(t)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(t){const e=this.keyedMap.get(t);return e?this.sortedSet.indexOf(e):-1}get size(){return this.sortedSet.size}forEach(t){this.sortedSet.inorderTraversal((e,n)=>(t(e),!1))}add(t){const e=this.delete(t.key);return e.copy(e.keyedMap.insert(t.key,t),e.sortedSet.insert(t,null))}delete(t){const e=this.get(t);return e?this.copy(this.keyedMap.remove(t),this.sortedSet.remove(e)):this}isEqual(t){if(!(t instanceof Pe)||this.size!==t.size)return!1;const e=this.sortedSet.getIterator(),n=t.sortedSet.getIterator();for(;e.hasNext();){const i=e.getNext().key,o=n.getNext().key;if(!i.isEqual(o))return!1}return!0}toString(){const t=[];return this.forEach(e=>{t.push(e.toString())}),t.length===0?"DocumentSet ()":`DocumentSet (
  `+t.join(`  
`)+`
)`}copy(t,e){const n=new Pe;return n.comparator=this.comparator,n.keyedMap=t,n.sortedSet=e,n}}/**
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
 */class Zo{constructor(){this.ga=new nt(O.comparator)}track(t){const e=t.doc.key,n=this.ga.get(e);n?t.type!==0&&n.type===3?this.ga=this.ga.insert(e,t):t.type===3&&n.type!==1?this.ga=this.ga.insert(e,{type:n.type,doc:t.doc}):t.type===2&&n.type===2?this.ga=this.ga.insert(e,{type:2,doc:t.doc}):t.type===2&&n.type===0?this.ga=this.ga.insert(e,{type:0,doc:t.doc}):t.type===1&&n.type===0?this.ga=this.ga.remove(e):t.type===1&&n.type===2?this.ga=this.ga.insert(e,{type:1,doc:n.doc}):t.type===0&&n.type===1?this.ga=this.ga.insert(e,{type:2,doc:t.doc}):F(63341,{Rt:t,pa:n}):this.ga=this.ga.insert(e,t)}ya(){const t=[];return this.ga.inorderTraversal((e,n)=>{t.push(n)}),t}}class Oe{constructor(t,e,n,i,o,c,l,d,f){this.query=t,this.docs=e,this.oldDocs=n,this.docChanges=i,this.mutatedKeys=o,this.fromCache=c,this.syncStateChanged=l,this.excludesMetadataChanges=d,this.hasCachedResults=f}static fromInitialDocuments(t,e,n,i,o){const c=[];return e.forEach(l=>{c.push({type:0,doc:l})}),new Oe(t,e,Pe.emptySet(e),c,n,i,!0,!1,o)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(t){if(!(this.fromCache===t.fromCache&&this.hasCachedResults===t.hasCachedResults&&this.syncStateChanged===t.syncStateChanged&&this.mutatedKeys.isEqual(t.mutatedKeys)&&hr(this.query,t.query)&&this.docs.isEqual(t.docs)&&this.oldDocs.isEqual(t.oldDocs)))return!1;const e=this.docChanges,n=t.docChanges;if(e.length!==n.length)return!1;for(let i=0;i<e.length;i++)if(e[i].type!==n[i].type||!e[i].doc.isEqual(n[i].doc))return!1;return!0}}/**
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
 */class pf{constructor(){this.wa=void 0,this.Sa=[]}ba(){return this.Sa.some(t=>t.Da())}}class _f{constructor(){this.queries=ta(),this.onlineState="Unknown",this.Ca=new Set}terminate(){(function(e,n){const i=$(e),o=i.queries;i.queries=ta(),o.forEach((c,l)=>{for(const d of l.Sa)d.onError(n)})})(this,new x(P.ABORTED,"Firestore shutting down"))}}function ta(){return new pe(r=>qa(r),hr)}async function yf(r,t){const e=$(r);let n=3;const i=t.query;let o=e.queries.get(i);o?!o.ba()&&t.Da()&&(n=2):(o=new pf,n=t.Da()?0:1);try{switch(n){case 0:o.wa=await e.onListen(i,!0);break;case 1:o.wa=await e.onListen(i,!1);break;case 2:await e.onFirstRemoteStoreListen(i)}}catch(c){const l=gc(c,`Initialization of query '${we(t.query)}' failed`);return void t.onError(l)}e.queries.set(i,o),o.Sa.push(t),t.va(e.onlineState),o.wa&&t.Fa(o.wa)&&Ws(e)}async function Ef(r,t){const e=$(r),n=t.query;let i=3;const o=e.queries.get(n);if(o){const c=o.Sa.indexOf(t);c>=0&&(o.Sa.splice(c,1),o.Sa.length===0?i=t.Da()?0:1:!o.ba()&&t.Da()&&(i=2))}switch(i){case 0:return e.queries.delete(n),e.onUnlisten(n,!0);case 1:return e.queries.delete(n),e.onUnlisten(n,!1);case 2:return e.onLastRemoteStoreUnlisten(n);default:return}}function Tf(r,t){const e=$(r);let n=!1;for(const i of t){const o=i.query,c=e.queries.get(o);if(c){for(const l of c.Sa)l.Fa(i)&&(n=!0);c.wa=i}}n&&Ws(e)}function vf(r,t,e){const n=$(r),i=n.queries.get(t);if(i)for(const o of i.Sa)o.onError(e);n.queries.delete(t)}function Ws(r){r.Ca.forEach(t=>{t.next()})}var As,ea;(ea=As||(As={})).Ma="default",ea.Cache="cache";class If{constructor(t,e,n){this.query=t,this.xa=e,this.Oa=!1,this.Na=null,this.onlineState="Unknown",this.options=n||{}}Fa(t){if(!this.options.includeMetadataChanges){const n=[];for(const i of t.docChanges)i.type!==3&&n.push(i);t=new Oe(t.query,t.docs,t.oldDocs,n,t.mutatedKeys,t.fromCache,t.syncStateChanged,!0,t.hasCachedResults)}let e=!1;return this.Oa?this.Ba(t)&&(this.xa.next(t),e=!0):this.La(t,this.onlineState)&&(this.ka(t),e=!0),this.Na=t,e}onError(t){this.xa.error(t)}va(t){this.onlineState=t;let e=!1;return this.Na&&!this.Oa&&this.La(this.Na,t)&&(this.ka(this.Na),e=!0),e}La(t,e){if(!t.fromCache||!this.Da())return!0;const n=e!=="Offline";return(!this.options.qa||!n)&&(!t.docs.isEmpty()||t.hasCachedResults||e==="Offline")}Ba(t){if(t.docChanges.length>0)return!0;const e=this.Na&&this.Na.hasPendingWrites!==t.hasPendingWrites;return!(!t.syncStateChanged&&!e)&&this.options.includeMetadataChanges===!0}ka(t){t=Oe.fromInitialDocuments(t.query,t.docs,t.mutatedKeys,t.fromCache,t.hasCachedResults),this.Oa=!0,this.xa.next(t)}Da(){return this.options.source!==As.Cache}}/**
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
 */class pc{constructor(t){this.key=t}}class _c{constructor(t){this.key=t}}class wf{constructor(t,e){this.query=t,this.Ya=e,this.Za=null,this.hasCachedResults=!1,this.current=!1,this.Xa=z(),this.mutatedKeys=z(),this.eu=$a(t),this.tu=new Pe(this.eu)}get nu(){return this.Ya}ru(t,e){const n=e?e.iu:new Zo,i=e?e.tu:this.tu;let o=e?e.mutatedKeys:this.mutatedKeys,c=i,l=!1;const d=this.query.limitType==="F"&&i.size===this.query.limit?i.last():null,f=this.query.limitType==="L"&&i.size===this.query.limit?i.first():null;if(t.inorderTraversal((_,v)=>{const R=i.get(_),S=dr(this.query,v)?v:null,N=!!R&&this.mutatedKeys.has(R.key),M=!!S&&(S.hasLocalMutations||this.mutatedKeys.has(S.key)&&S.hasCommittedMutations);let D=!1;R&&S?R.data.isEqual(S.data)?N!==M&&(n.track({type:3,doc:S}),D=!0):this.su(R,S)||(n.track({type:2,doc:S}),D=!0,(d&&this.eu(S,d)>0||f&&this.eu(S,f)<0)&&(l=!0)):!R&&S?(n.track({type:0,doc:S}),D=!0):R&&!S&&(n.track({type:1,doc:R}),D=!0,(d||f)&&(l=!0)),D&&(S?(c=c.add(S),o=M?o.add(_):o.delete(_)):(c=c.delete(_),o=o.delete(_)))}),this.query.limit!==null)for(;c.size>this.query.limit;){const _=this.query.limitType==="F"?c.last():c.first();c=c.delete(_.key),o=o.delete(_.key),n.track({type:1,doc:_})}return{tu:c,iu:n,Cs:l,mutatedKeys:o}}su(t,e){return t.hasLocalMutations&&e.hasCommittedMutations&&!e.hasLocalMutations}applyChanges(t,e,n,i){const o=this.tu;this.tu=t.tu,this.mutatedKeys=t.mutatedKeys;const c=t.iu.ya();c.sort((_,v)=>function(S,N){const M=D=>{switch(D){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return F(20277,{Rt:D})}};return M(S)-M(N)}(_.type,v.type)||this.eu(_.doc,v.doc)),this.ou(n),i=i??!1;const l=e&&!i?this._u():[],d=this.Xa.size===0&&this.current&&!i?1:0,f=d!==this.Za;return this.Za=d,c.length!==0||f?{snapshot:new Oe(this.query,t.tu,o,c,t.mutatedKeys,d===0,f,!1,!!n&&n.resumeToken.approximateByteSize()>0),au:l}:{au:l}}va(t){return this.current&&t==="Offline"?(this.current=!1,this.applyChanges({tu:this.tu,iu:new Zo,mutatedKeys:this.mutatedKeys,Cs:!1},!1)):{au:[]}}uu(t){return!this.Ya.has(t)&&!!this.tu.has(t)&&!this.tu.get(t).hasLocalMutations}ou(t){t&&(t.addedDocuments.forEach(e=>this.Ya=this.Ya.add(e)),t.modifiedDocuments.forEach(e=>{}),t.removedDocuments.forEach(e=>this.Ya=this.Ya.delete(e)),this.current=t.current)}_u(){if(!this.current)return[];const t=this.Xa;this.Xa=z(),this.tu.forEach(n=>{this.uu(n.key)&&(this.Xa=this.Xa.add(n.key))});const e=[];return t.forEach(n=>{this.Xa.has(n)||e.push(new _c(n))}),this.Xa.forEach(n=>{t.has(n)||e.push(new pc(n))}),e}cu(t){this.Ya=t.Qs,this.Xa=z();const e=this.ru(t.documents);return this.applyChanges(e,!0)}lu(){return Oe.fromInitialDocuments(this.query,this.tu,this.mutatedKeys,this.Za===0,this.hasCachedResults)}}const Xs="SyncEngine";class Af{constructor(t,e,n){this.query=t,this.targetId=e,this.view=n}}class Rf{constructor(t){this.key=t,this.hu=!1}}class Cf{constructor(t,e,n,i,o,c){this.localStore=t,this.remoteStore=e,this.eventManager=n,this.sharedClientState=i,this.currentUser=o,this.maxConcurrentLimboResolutions=c,this.Pu={},this.Tu=new pe(l=>qa(l),hr),this.Iu=new Map,this.Eu=new Set,this.du=new nt(O.comparator),this.Au=new Map,this.Ru=new Bs,this.Vu={},this.mu=new Map,this.fu=xe.cr(),this.onlineState="Unknown",this.gu=void 0}get isPrimaryClient(){return this.gu===!0}}async function Sf(r,t,e=!0){const n=Ic(r);let i;const o=n.Tu.get(t);return o?(n.sharedClientState.addLocalQueryTarget(o.targetId),i=o.view.lu()):i=await yc(n,t,e,!0),i}async function Pf(r,t){const e=Ic(r);await yc(e,t,!0,!1)}async function yc(r,t,e,n){const i=await Xd(r.localStore,xt(t)),o=i.targetId,c=r.sharedClientState.addLocalQueryTarget(o,e);let l;return n&&(l=await bf(r,t,o,c==="current",i.resumeToken)),r.isPrimaryClient&&e&&dc(r.remoteStore,i),l}async function bf(r,t,e,n,i){r.pu=(v,R,S)=>async function(M,D,Q,H){let G=D.view.ru(Q);G.Cs&&(G=await Go(M.localStore,D.query,!1).then(({documents:E})=>D.view.ru(E,G)));const tt=H&&H.targetChanges.get(D.targetId),gt=H&&H.targetMismatches.get(D.targetId)!=null,J=D.view.applyChanges(G,M.isPrimaryClient,tt,gt);return ra(M,D.targetId,J.au),J.snapshot}(r,v,R,S);const o=await Go(r.localStore,t,!0),c=new wf(t,o.Qs),l=c.ru(o.documents),d=wn.createSynthesizedTargetChangeForCurrentChange(e,n&&r.onlineState!=="Offline",i),f=c.applyChanges(l,r.isPrimaryClient,d);ra(r,e,f.au);const _=new Af(t,e,c);return r.Tu.set(t,_),r.Iu.has(e)?r.Iu.get(e).push(t):r.Iu.set(e,[t]),f.snapshot}async function Vf(r,t,e){const n=$(r),i=n.Tu.get(t),o=n.Iu.get(i.targetId);if(o.length>1)return n.Iu.set(i.targetId,o.filter(c=>!hr(c,t))),void n.Tu.delete(t);n.isPrimaryClient?(n.sharedClientState.removeLocalQueryTarget(i.targetId),n.sharedClientState.isActiveQueryTarget(i.targetId)||await Is(n.localStore,i.targetId,!1).then(()=>{n.sharedClientState.clearQueryState(i.targetId),e&&zs(n.remoteStore,i.targetId),Rs(n,i.targetId)}).catch(or)):(Rs(n,i.targetId),await Is(n.localStore,i.targetId,!0))}async function Df(r,t){const e=$(r),n=e.Tu.get(t),i=e.Iu.get(n.targetId);e.isPrimaryClient&&i.length===1&&(e.sharedClientState.removeLocalQueryTarget(n.targetId),zs(e.remoteStore,n.targetId))}async function Ec(r,t){const e=$(r);try{const n=await Qd(e.localStore,t);t.targetChanges.forEach((i,o)=>{const c=e.Au.get(o);c&&(Y(i.addedDocuments.size+i.modifiedDocuments.size+i.removedDocuments.size<=1,22616),i.addedDocuments.size>0?c.hu=!0:i.modifiedDocuments.size>0?Y(c.hu,14607):i.removedDocuments.size>0&&(Y(c.hu,42227),c.hu=!1))}),await vc(e,n,t)}catch(n){await or(n)}}function na(r,t,e){const n=$(r);if(n.isPrimaryClient&&e===0||!n.isPrimaryClient&&e===1){const i=[];n.Tu.forEach((o,c)=>{const l=c.view.va(t);l.snapshot&&i.push(l.snapshot)}),function(c,l){const d=$(c);d.onlineState=l;let f=!1;d.queries.forEach((_,v)=>{for(const R of v.Sa)R.va(l)&&(f=!0)}),f&&Ws(d)}(n.eventManager,t),i.length&&n.Pu.H_(i),n.onlineState=t,n.isPrimaryClient&&n.sharedClientState.setOnlineState(t)}}async function Nf(r,t,e){const n=$(r);n.sharedClientState.updateQueryState(t,"rejected",e);const i=n.Au.get(t),o=i&&i.key;if(o){let c=new nt(O.comparator);c=c.insert(o,Et.newNoDocument(o,L.min()));const l=z().add(o),d=new gr(L.min(),new Map,new nt(B),c,l);await Ec(n,d),n.du=n.du.remove(o),n.Au.delete(t),Ys(n)}else await Is(n.localStore,t,!1).then(()=>Rs(n,t,e)).catch(or)}function Rs(r,t,e=null){r.sharedClientState.removeLocalQueryTarget(t);for(const n of r.Iu.get(t))r.Tu.delete(n),e&&r.Pu.yu(n,e);r.Iu.delete(t),r.isPrimaryClient&&r.Ru.jr(t).forEach(n=>{r.Ru.containsKey(n)||Tc(r,n)})}function Tc(r,t){r.Eu.delete(t.path.canonicalString());const e=r.du.get(t);e!==null&&(zs(r.remoteStore,e),r.du=r.du.remove(t),r.Au.delete(e),Ys(r))}function ra(r,t,e){for(const n of e)n instanceof pc?(r.Ru.addReference(n.key,t),xf(r,n)):n instanceof _c?(V(Xs,"Document no longer in limbo: "+n.key),r.Ru.removeReference(n.key,t),r.Ru.containsKey(n.key)||Tc(r,n.key)):F(19791,{wu:n})}function xf(r,t){const e=t.key,n=e.path.canonicalString();r.du.get(e)||r.Eu.has(n)||(V(Xs,"New document in limbo: "+e),r.Eu.add(n),Ys(r))}function Ys(r){for(;r.Eu.size>0&&r.du.size<r.maxConcurrentLimboResolutions;){const t=r.Eu.values().next().value;r.Eu.delete(t);const e=new O(X.fromString(t)),n=r.fu.next();r.Au.set(n,new Rf(e)),r.du=r.du.insert(e,n),dc(r.remoteStore,new Gt(xt(Ms(e.path)),n,"TargetPurposeLimboResolution",ar.ce))}}async function vc(r,t,e){const n=$(r),i=[],o=[],c=[];n.Tu.isEmpty()||(n.Tu.forEach((l,d)=>{c.push(n.pu(d,t,e).then(f=>{var _;if((f||e)&&n.isPrimaryClient){const v=f?!f.fromCache:(_=e==null?void 0:e.targetChanges.get(d.targetId))==null?void 0:_.current;n.sharedClientState.updateQueryState(d.targetId,v?"current":"not-current")}if(f){i.push(f);const v=qs.As(d.targetId,f);o.push(v)}}))}),await Promise.all(c),n.Pu.H_(i),await async function(d,f){const _=$(d);try{await _.persistence.runTransaction("notifyLocalViewChanges","readwrite",v=>C.forEach(f,R=>C.forEach(R.Es,S=>_.persistence.referenceDelegate.addReference(v,R.targetId,S)).next(()=>C.forEach(R.ds,S=>_.persistence.referenceDelegate.removeReference(v,R.targetId,S)))))}catch(v){if(!Fe(v))throw v;V($s,"Failed to update sequence numbers: "+v)}for(const v of f){const R=v.targetId;if(!v.fromCache){const S=_.Ms.get(R),N=S.snapshotVersion,M=S.withLastLimboFreeSnapshotVersion(N);_.Ms=_.Ms.insert(R,M)}}}(n.localStore,o))}async function kf(r,t){const e=$(r);if(!e.currentUser.isEqual(t)){V(Xs,"User change. New user:",t.toKey());const n=await cc(e.localStore,t);e.currentUser=t,function(o,c){o.mu.forEach(l=>{l.forEach(d=>{d.reject(new x(P.CANCELLED,c))})}),o.mu.clear()}(e,"'waitForPendingWrites' promise is rejected due to a user change."),e.sharedClientState.handleUserChange(t,n.removedBatchIds,n.addedBatchIds),await vc(e,n.Ls)}}function Of(r,t){const e=$(r),n=e.Au.get(t);if(n&&n.hu)return z().add(n.key);{let i=z();const o=e.Iu.get(t);if(!o)return i;for(const c of o){const l=e.Tu.get(c);i=i.unionWith(l.view.nu)}return i}}function Ic(r){const t=$(r);return t.remoteStore.remoteSyncer.applyRemoteEvent=Ec.bind(null,t),t.remoteStore.remoteSyncer.getRemoteKeysForTarget=Of.bind(null,t),t.remoteStore.remoteSyncer.rejectListen=Nf.bind(null,t),t.Pu.H_=Tf.bind(null,t.eventManager),t.Pu.yu=vf.bind(null,t.eventManager),t}class ir{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(t){this.serializer=lc(t.databaseInfo.databaseId),this.sharedClientState=this.Du(t),this.persistence=this.Cu(t),await this.persistence.start(),this.localStore=this.vu(t),this.gcScheduler=this.Fu(t,this.localStore),this.indexBackfillerScheduler=this.Mu(t,this.localStore)}Fu(t,e){return null}Mu(t,e){return null}vu(t){return Kd(this.persistence,new zd,t.initialUser,this.serializer)}Cu(t){return new ac(js.mi,this.serializer)}Du(t){return new Jd}async terminate(){var t,e;(t=this.gcScheduler)==null||t.stop(),(e=this.indexBackfillerScheduler)==null||e.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}}ir.provider={build:()=>new ir};class Mf extends ir{constructor(t){super(),this.cacheSizeBytes=t}Fu(t,e){Y(this.persistence.referenceDelegate instanceof sr,46915);const n=this.persistence.referenceDelegate.garbageCollector;return new bd(n,t.asyncQueue,e)}Cu(t){const e=this.cacheSizeBytes!==void 0?At.withCacheSize(this.cacheSizeBytes):At.DEFAULT;return new ac(n=>sr.mi(n,e),this.serializer)}}class Cs{async initialize(t,e){this.localStore||(this.localStore=t.localStore,this.sharedClientState=t.sharedClientState,this.datastore=this.createDatastore(e),this.remoteStore=this.createRemoteStore(e),this.eventManager=this.createEventManager(e),this.syncEngine=this.createSyncEngine(e,!t.synchronizeTabs),this.sharedClientState.onlineStateHandler=n=>na(this.syncEngine,n,1),this.remoteStore.remoteSyncer.handleCredentialChange=kf.bind(null,this.syncEngine),await gf(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(t){return function(){return new _f}()}createDatastore(t){const e=lc(t.databaseInfo.databaseId),n=function(o){return new rf(o)}(t.databaseInfo);return function(o,c,l,d){return new cf(o,c,l,d)}(t.authCredentials,t.appCheckCredentials,n,e)}createRemoteStore(t){return function(n,i,o,c,l){return new lf(n,i,o,c,l)}(this.localStore,this.datastore,t.asyncQueue,e=>na(this.syncEngine,e,0),function(){return Wo.v()?new Wo:new Zd}())}createSyncEngine(t,e){return function(i,o,c,l,d,f,_){const v=new Cf(i,o,c,l,d,f);return _&&(v.gu=!0),v}(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,t.initialUser,t.maxConcurrentLimboResolutions,e)}async terminate(){var t,e;await async function(i){const o=$(i);V(ke,"RemoteStore shutting down."),o.Ea.add(5),await An(o),o.Aa.shutdown(),o.Ra.set("Unknown")}(this.remoteStore),(t=this.datastore)==null||t.terminate(),(e=this.eventManager)==null||e.terminate()}}Cs.provider={build:()=>new Cs};/**
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
 */class Lf{constructor(t){this.observer=t,this.muted=!1}next(t){this.muted||this.observer.next&&this.Ou(this.observer.next,t)}error(t){this.muted||(this.observer.error?this.Ou(this.observer.error,t):Ft("Uncaught Error in snapshot listener:",t.toString()))}Nu(){this.muted=!0}Ou(t,e){setTimeout(()=>{this.muted||t(e)},0)}}/**
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
 */const re="FirestoreClient";class Ff{constructor(t,e,n,i,o){this.authCredentials=t,this.appCheckCredentials=e,this.asyncQueue=n,this.databaseInfo=i,this.user=yt.UNAUTHENTICATED,this.clientId=Ds.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=o,this.authCredentials.start(n,async c=>{V(re,"Received user=",c.uid),await this.authCredentialListener(c),this.user=c}),this.appCheckCredentials.start(n,c=>(V(re,"Received new app check token=",c),this.appCheckCredentialListener(c,this.user)))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this.databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(t){this.authCredentialListener=t}setAppCheckTokenChangeListener(t){this.appCheckCredentialListener=t}terminate(){this.asyncQueue.enterRestrictedMode();const t=new he;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted(async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),t.resolve()}catch(e){const n=gc(e,"Failed to shutdown persistence");t.reject(n)}}),t.promise}}async function Xr(r,t){r.asyncQueue.verifyOperationInProgress(),V(re,"Initializing OfflineComponentProvider");const e=r.configuration;await t.initialize(e);let n=e.initialUser;r.setCredentialChangeListener(async i=>{n.isEqual(i)||(await cc(t.localStore,i),n=i)}),t.persistence.setDatabaseDeletedListener(()=>r.terminate()),r._offlineComponents=t}async function sa(r,t){r.asyncQueue.verifyOperationInProgress();const e=await Uf(r);V(re,"Initializing OnlineComponentProvider"),await t.initialize(e,r.configuration),r.setCredentialChangeListener(n=>Jo(t.remoteStore,n)),r.setAppCheckTokenChangeListener((n,i)=>Jo(t.remoteStore,i)),r._onlineComponents=t}async function Uf(r){if(!r._offlineComponents)if(r._uninitializedComponentsProvider){V(re,"Using user provided OfflineComponentProvider");try{await Xr(r,r._uninitializedComponentsProvider._offline)}catch(t){const e=t;if(!function(i){return i.name==="FirebaseError"?i.code===P.FAILED_PRECONDITION||i.code===P.UNIMPLEMENTED:!(typeof DOMException<"u"&&i instanceof DOMException)||i.code===22||i.code===20||i.code===11}(e))throw e;be("Error using user provided cache. Falling back to memory cache: "+e),await Xr(r,new ir)}}else V(re,"Using default OfflineComponentProvider"),await Xr(r,new Mf(void 0));return r._offlineComponents}async function Bf(r){return r._onlineComponents||(r._uninitializedComponentsProvider?(V(re,"Using user provided OnlineComponentProvider"),await sa(r,r._uninitializedComponentsProvider._online)):(V(re,"Using default OnlineComponentProvider"),await sa(r,new Cs))),r._onlineComponents}async function jf(r){const t=await Bf(r),e=t.eventManager;return e.onListen=Sf.bind(null,t.syncEngine),e.onUnlisten=Vf.bind(null,t.syncEngine),e.onFirstRemoteStoreListen=Pf.bind(null,t.syncEngine),e.onLastRemoteStoreUnlisten=Df.bind(null,t.syncEngine),e}function qf(r,t,e={}){const n=new he;return r.asyncQueue.enqueueAndForget(async()=>function(o,c,l,d,f){const _=new Lf({next:R=>{_.Nu(),c.enqueueAndForget(()=>Ef(o,v));const S=R.docs.has(l);!S&&R.fromCache?f.reject(new x(P.UNAVAILABLE,"Failed to get document because the client is offline.")):S&&R.fromCache&&d&&d.source==="server"?f.reject(new x(P.UNAVAILABLE,'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')):f.resolve(R)},error:R=>f.reject(R)}),v=new If(Ms(l.path),_,{includeMetadataChanges:!0,qa:!0});return yf(o,v)}(await jf(r),r.asyncQueue,t,e,n)),n.promise}/**
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
 */function wc(r){const t={};return r.timeoutSeconds!==void 0&&(t.timeoutSeconds=r.timeoutSeconds),t}/**
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
 */const ia=new Map;/**
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
 */const Ac="firestore.googleapis.com",oa=!0;class aa{constructor(t){if(t.host===void 0){if(t.ssl!==void 0)throw new x(P.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=Ac,this.ssl=oa}else this.host=t.host,this.ssl=t.ssl??oa;if(this.isUsingEmulator=t.emulatorOptions!==void 0,this.credentials=t.credentials,this.ignoreUndefinedProperties=!!t.ignoreUndefinedProperties,this.localCache=t.localCache,t.cacheSizeBytes===void 0)this.cacheSizeBytes=oc;else{if(t.cacheSizeBytes!==-1&&t.cacheSizeBytes<Sd)throw new x(P.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=t.cacheSizeBytes}ah("experimentalForceLongPolling",t.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",t.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!t.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:t.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!t.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=wc(t.experimentalLongPollingOptions??{}),function(n){if(n.timeoutSeconds!==void 0){if(isNaN(n.timeoutSeconds))throw new x(P.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (must not be NaN)`);if(n.timeoutSeconds<5)throw new x(P.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (minimum allowed value is 5)`);if(n.timeoutSeconds>30)throw new x(P.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (maximum allowed value is 30)`)}}(this.experimentalLongPollingOptions),this.useFetchStreams=!!t.useFetchStreams}isEqual(t){return this.host===t.host&&this.ssl===t.ssl&&this.credentials===t.credentials&&this.cacheSizeBytes===t.cacheSizeBytes&&this.experimentalForceLongPolling===t.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===t.experimentalAutoDetectLongPolling&&function(n,i){return n.timeoutSeconds===i.timeoutSeconds}(this.experimentalLongPollingOptions,t.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===t.ignoreUndefinedProperties&&this.useFetchStreams===t.useFetchStreams}}class Js{constructor(t,e,n,i){this._authCredentials=t,this._appCheckCredentials=e,this._databaseId=n,this._app=i,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new aa({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new x(P.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(t){if(this._settingsFrozen)throw new x(P.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new aa(t),this._emulatorOptions=t.emulatorOptions||{},t.credentials!==void 0&&(this._authCredentials=function(n){if(!n)return new Xl;switch(n.type){case"firstParty":return new th(n.sessionIndex||"0",n.iamToken||null,n.authTokenFactory||null);case"provider":return n.client;default:throw new x(P.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}}(t.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return function(e){const n=ia.get(e);n&&(V("ComponentProvider","Removing Datastore"),ia.delete(e),n.terminate())}(this),Promise.resolve()}}function $f(r,t,e,n={}){var f;r=ls(r,Js);const i=Ps(t),o=r._getSettings(),c={...o,emulatorOptions:r._getEmulatorOptions()},l=`${t}:${e}`;i&&(Iu(`https://${l}`),Cu("Firestore",!0)),o.host!==Ac&&o.host!==l&&be("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");const d={...o,host:l,ssl:i,emulatorOptions:n};if(!Yn(d,c)&&(r._setSettings(d),n.mockUserToken)){let _,v;if(typeof n.mockUserToken=="string")_=n.mockUserToken,v=yt.MOCK_USER;else{_=wu(n.mockUserToken,(f=r._app)==null?void 0:f.options.projectId);const R=n.mockUserToken.sub||n.mockUserToken.user_id;if(!R)throw new x(P.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");v=new yt(R)}r._authCredentials=new Yl(new ba(_,v))}}/**
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
 */class Zs{constructor(t,e,n){this.converter=e,this._query=n,this.type="query",this.firestore=t}withConverter(t){return new Zs(this.firestore,t,this._query)}}class wt{constructor(t,e,n){this.converter=e,this._key=n,this.type="document",this.firestore=t}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new Tn(this.firestore,this.converter,this._key.path.popLast())}withConverter(t){return new wt(this.firestore,t,this._key)}toJSON(){return{type:wt._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(t,e,n){if(vn(e,wt._jsonSchema))return new wt(t,n||null,new O(X.fromString(e.referencePath)))}}wt._jsonSchemaVersion="firestore/documentReference/1.0",wt._jsonSchema={type:it("string",wt._jsonSchemaVersion),referencePath:it("string")};class Tn extends Zs{constructor(t,e,n){super(t,e,Ms(n)),this._path=n,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const t=this._path.popLast();return t.isEmpty()?null:new wt(this.firestore,null,new O(t))}withConverter(t){return new Tn(this.firestore,t,this._path)}}function Yr(r,t,...e){if(r=Ou(r),arguments.length===1&&(t=Ds.newId()),oh("doc","path",t),r instanceof Js){const n=X.fromString(t,...e);return To(n),new wt(r,null,new O(n))}{if(!(r instanceof wt||r instanceof Tn))throw new x(P.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const n=r._path.child(X.fromString(t,...e));return To(n),new wt(r.firestore,r instanceof Tn?r.converter:null,new O(n))}}/**
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
 */const ca="AsyncQueue";class ua{constructor(t=Promise.resolve()){this.Xu=[],this.ec=!1,this.tc=[],this.nc=null,this.rc=!1,this.sc=!1,this.oc=[],this.M_=new hc(this,"async_queue_retry"),this._c=()=>{const n=Wr();n&&V(ca,"Visibility state changed to "+n.visibilityState),this.M_.w_()},this.ac=t;const e=Wr();e&&typeof e.addEventListener=="function"&&e.addEventListener("visibilitychange",this._c)}get isShuttingDown(){return this.ec}enqueueAndForget(t){this.enqueue(t)}enqueueAndForgetEvenWhileRestricted(t){this.uc(),this.cc(t)}enterRestrictedMode(t){if(!this.ec){this.ec=!0,this.sc=t||!1;const e=Wr();e&&typeof e.removeEventListener=="function"&&e.removeEventListener("visibilitychange",this._c)}}enqueue(t){if(this.uc(),this.ec)return new Promise(()=>{});const e=new he;return this.cc(()=>this.ec&&this.sc?Promise.resolve():(t().then(e.resolve,e.reject),e.promise)).then(()=>e.promise)}enqueueRetryable(t){this.enqueueAndForget(()=>(this.Xu.push(t),this.lc()))}async lc(){if(this.Xu.length!==0){try{await this.Xu[0](),this.Xu.shift(),this.M_.reset()}catch(t){if(!Fe(t))throw t;V(ca,"Operation failed with retryable error: "+t)}this.Xu.length>0&&this.M_.p_(()=>this.lc())}}cc(t){const e=this.ac.then(()=>(this.rc=!0,t().catch(n=>{throw this.nc=n,this.rc=!1,Ft("INTERNAL UNHANDLED ERROR: ",la(n)),n}).then(n=>(this.rc=!1,n))));return this.ac=e,e}enqueueAfterDelay(t,e,n){this.uc(),this.oc.indexOf(t)>-1&&(e=0);const i=Qs.createAndSchedule(this,t,e,n,o=>this.hc(o));return this.tc.push(i),i}uc(){this.nc&&F(47125,{Pc:la(this.nc)})}verifyOperationInProgress(){}async Tc(){let t;do t=this.ac,await t;while(t!==this.ac)}Ic(t){for(const e of this.tc)if(e.timerId===t)return!0;return!1}Ec(t){return this.Tc().then(()=>{this.tc.sort((e,n)=>e.targetTimeMs-n.targetTimeMs);for(const e of this.tc)if(e.skipDelay(),t!=="all"&&e.timerId===t)break;return this.Tc()})}dc(t){this.oc.push(t)}hc(t){const e=this.tc.indexOf(t);this.tc.splice(e,1)}}function la(r){let t=r.message||"";return r.stack&&(t=r.stack.includes(r.message)?r.stack:r.message+`
`+r.stack),t}class Rc extends Js{constructor(t,e,n,i){super(t,e,n,i),this.type="firestore",this._queue=new ua,this._persistenceKey=(i==null?void 0:i.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const t=this._firestoreClient.terminate();this._queue=new ua(t),this._firestoreClient=void 0,await t}}}function zf(r,t){const e=typeof r=="object"?r:Ll(),n=typeof r=="string"?r:Zn,i=Nl(e,"firestore").getImmediate({identifier:n});if(!i._initialized){const o=Tu("firestore");o&&$f(i,...o)}return i}function Hf(r){if(r._terminated)throw new x(P.FAILED_PRECONDITION,"The client has already been terminated.");return r._firestoreClient||Gf(r),r._firestoreClient}function Gf(r){var n,i,o;const t=r._freezeSettings(),e=function(l,d,f,_){return new vh(l,d,f,_.host,_.ssl,_.experimentalForceLongPolling,_.experimentalAutoDetectLongPolling,wc(_.experimentalLongPollingOptions),_.useFetchStreams,_.isUsingEmulator)}(r._databaseId,((n=r._app)==null?void 0:n.options.appId)||"",r._persistenceKey,t);r._componentsProvider||(i=t.localCache)!=null&&i._offlineComponentProvider&&((o=t.localCache)!=null&&o._onlineComponentProvider)&&(r._componentsProvider={_offline:t.localCache._offlineComponentProvider,_online:t.localCache._onlineComponentProvider}),r._firestoreClient=new Ff(r._authCredentials,r._appCheckCredentials,r._queue,e,r._componentsProvider&&function(l){const d=l==null?void 0:l._online.build();return{_offline:l==null?void 0:l._offline.build(d),_online:d}}(r._componentsProvider))}/**
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
 */class Nt{constructor(t){this._byteString=t}static fromBase64String(t){try{return new Nt(mt.fromBase64String(t))}catch(e){throw new x(P.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+e)}}static fromUint8Array(t){return new Nt(mt.fromUint8Array(t))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(t){return this._byteString.isEqual(t._byteString)}toJSON(){return{type:Nt._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(t){if(vn(t,Nt._jsonSchema))return Nt.fromBase64String(t.bytes)}}Nt._jsonSchemaVersion="firestore/bytes/1.0",Nt._jsonSchema={type:it("string",Nt._jsonSchemaVersion),bytes:it("string")};/**
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
 */class Cc{constructor(...t){for(let e=0;e<t.length;++e)if(t[e].length===0)throw new x(P.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new It(t)}isEqual(t){return this._internalPath.isEqual(t._internalPath)}}/**
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
 */class Xt{constructor(t,e){if(!isFinite(t)||t<-90||t>90)throw new x(P.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+t);if(!isFinite(e)||e<-180||e>180)throw new x(P.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+e);this._lat=t,this._long=e}get latitude(){return this._lat}get longitude(){return this._long}isEqual(t){return this._lat===t._lat&&this._long===t._long}_compareTo(t){return B(this._lat,t._lat)||B(this._long,t._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:Xt._jsonSchemaVersion}}static fromJSON(t){if(vn(t,Xt._jsonSchema))return new Xt(t.latitude,t.longitude)}}Xt._jsonSchemaVersion="firestore/geoPoint/1.0",Xt._jsonSchema={type:it("string",Xt._jsonSchemaVersion),latitude:it("number"),longitude:it("number")};/**
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
 */class Yt{constructor(t){this._values=(t||[]).map(e=>e)}toArray(){return this._values.map(t=>t)}isEqual(t){return function(n,i){if(n.length!==i.length)return!1;for(let o=0;o<n.length;++o)if(n[o]!==i[o])return!1;return!0}(this._values,t._values)}toJSON(){return{type:Yt._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(t){if(vn(t,Yt._jsonSchema)){if(Array.isArray(t.vectorValues)&&t.vectorValues.every(e=>typeof e=="number"))return new Yt(t.vectorValues);throw new x(P.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}Yt._jsonSchemaVersion="firestore/vectorValue/1.0",Yt._jsonSchema={type:it("string",Yt._jsonSchemaVersion),vectorValues:it("object")};const Kf=new RegExp("[~\\*/\\[\\]]");function Qf(r,t,e){if(t.search(Kf)>=0)throw ha(`Invalid field path (${t}). Paths must not contain '~', '*', '/', '[', or ']'`,r);try{return new Cc(...t.split("."))._internalPath}catch{throw ha(`Invalid field path (${t}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,r)}}function ha(r,t,e,n,i){let o=`Function ${t}() called with invalid data`;o+=". ";let c="";return new x(P.INVALID_ARGUMENT,o+r+c)}/**
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
 */class Sc{constructor(t,e,n,i,o){this._firestore=t,this._userDataWriter=e,this._key=n,this._document=i,this._converter=o}get id(){return this._key.path.lastSegment()}get ref(){return new wt(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const t=new Wf(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(t)}return this._userDataWriter.convertValue(this._document.data.value)}}get(t){if(this._document){const e=this._document.data.field(Pc("DocumentSnapshot.get",t));if(e!==null)return this._userDataWriter.convertValue(e)}}}class Wf extends Sc{data(){return super.data()}}function Pc(r,t){return typeof t=="string"?Qf(r,t):t instanceof Cc?t._internalPath:t._delegate._internalPath}class Xf{convertValue(t,e="none"){switch(ee(t)){case 0:return null;case 1:return t.booleanValue;case 2:return et(t.integerValue||t.doubleValue);case 3:return this.convertTimestamp(t.timestampValue);case 4:return this.convertServerTimestamp(t,e);case 5:return t.stringValue;case 6:return this.convertBytes(te(t.bytesValue));case 7:return this.convertReference(t.referenceValue);case 8:return this.convertGeoPoint(t.geoPointValue);case 9:return this.convertArray(t.arrayValue,e);case 11:return this.convertObject(t.mapValue,e);case 10:return this.convertVectorValue(t.mapValue);default:throw F(62114,{value:t})}}convertObject(t,e){return this.convertObjectMap(t.fields,e)}convertObjectMap(t,e="none"){const n={};return In(t,(i,o)=>{n[i]=this.convertValue(o,e)}),n}convertVectorValue(t){var n,i,o;const e=(o=(i=(n=t.fields)==null?void 0:n[ds].arrayValue)==null?void 0:i.values)==null?void 0:o.map(c=>et(c.doubleValue));return new Yt(e)}convertGeoPoint(t){return new Xt(et(t.latitude),et(t.longitude))}convertArray(t,e){return(t.values||[]).map(n=>this.convertValue(n,e))}convertServerTimestamp(t,e){switch(e){case"previous":const n=ur(t);return n==null?null:this.convertValue(n,e);case"estimate":return this.convertTimestamp(_n(t));default:return null}}convertTimestamp(t){const e=Zt(t);return new st(e.seconds,e.nanos)}convertDocumentKey(t,e){const n=X.fromString(t);Y(ic(n),9688,{name:t});const i=new yn(n.get(1),n.get(3)),o=new O(n.popFirst(5));return i.isEqual(e)||Ft(`Document ${o} contains a document reference within a different database (${i.projectId}/${i.database}) which is not supported. It will be treated as a reference in the current database (${e.projectId}/${e.database}) instead.`),o}}class on{constructor(t,e){this.hasPendingWrites=t,this.fromCache=e}isEqual(t){return this.hasPendingWrites===t.hasPendingWrites&&this.fromCache===t.fromCache}}class fe extends Sc{constructor(t,e,n,i,o,c){super(t,e,n,i,c),this._firestore=t,this._firestoreImpl=t,this.metadata=o}exists(){return super.exists()}data(t={}){if(this._document){if(this._converter){const e=new Wn(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(e,t)}return this._userDataWriter.convertValue(this._document.data.value,t.serverTimestamps)}}get(t,e={}){if(this._document){const n=this._document.data.field(Pc("DocumentSnapshot.get",t));if(n!==null)return this._userDataWriter.convertValue(n,e.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new x(P.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const t=this._document,e={};return e.type=fe._jsonSchemaVersion,e.bundle="",e.bundleSource="DocumentSnapshot",e.bundleName=this._key.toString(),!t||!t.isValidDocument()||!t.isFoundDocument()?e:(this._userDataWriter.convertObjectMap(t.data.value.mapValue.fields,"previous"),e.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),e)}}fe._jsonSchemaVersion="firestore/documentSnapshot/1.0",fe._jsonSchema={type:it("string",fe._jsonSchemaVersion),bundleSource:it("string","DocumentSnapshot"),bundleName:it("string"),bundle:it("string")};class Wn extends fe{data(t={}){return super.data(t)}}class dn{constructor(t,e,n,i){this._firestore=t,this._userDataWriter=e,this._snapshot=i,this.metadata=new on(i.hasPendingWrites,i.fromCache),this.query=n}get docs(){const t=[];return this.forEach(e=>t.push(e)),t}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(t,e){this._snapshot.docs.forEach(n=>{t.call(e,new Wn(this._firestore,this._userDataWriter,n.key,n,new on(this._snapshot.mutatedKeys.has(n.key),this._snapshot.fromCache),this.query.converter))})}docChanges(t={}){const e=!!t.includeMetadataChanges;if(e&&this._snapshot.excludesMetadataChanges)throw new x(P.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===e||(this._cachedChanges=function(i,o){if(i._snapshot.oldDocs.isEmpty()){let c=0;return i._snapshot.docChanges.map(l=>{const d=new Wn(i._firestore,i._userDataWriter,l.doc.key,l.doc,new on(i._snapshot.mutatedKeys.has(l.doc.key),i._snapshot.fromCache),i.query.converter);return l.doc,{type:"added",doc:d,oldIndex:-1,newIndex:c++}})}{let c=i._snapshot.oldDocs;return i._snapshot.docChanges.filter(l=>o||l.type!==3).map(l=>{const d=new Wn(i._firestore,i._userDataWriter,l.doc.key,l.doc,new on(i._snapshot.mutatedKeys.has(l.doc.key),i._snapshot.fromCache),i.query.converter);let f=-1,_=-1;return l.type!==0&&(f=c.indexOf(l.doc.key),c=c.delete(l.doc.key)),l.type!==1&&(c=c.add(l.doc),_=c.indexOf(l.doc.key)),{type:Yf(l.type),doc:d,oldIndex:f,newIndex:_}})}}(this,e),this._cachedChangesIncludeMetadataChanges=e),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new x(P.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const t={};t.type=dn._jsonSchemaVersion,t.bundleSource="QuerySnapshot",t.bundleName=Ds.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const e=[],n=[],i=[];return this.docs.forEach(o=>{o._document!==null&&(e.push(o._document),n.push(this._userDataWriter.convertObjectMap(o._document.data.value.mapValue.fields,"previous")),i.push(o.ref.path))}),t.bundle=(this._firestore,this.query._query,t.bundleName,"NOT SUPPORTED"),t}}function Yf(r){switch(r){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return F(61501,{type:r})}}/**
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
 */function Jr(r){r=ls(r,wt);const t=ls(r.firestore,Rc);return qf(Hf(t),r._key).then(e=>Zf(t,r,e))}dn._jsonSchemaVersion="firestore/querySnapshot/1.0",dn._jsonSchema={type:it("string",dn._jsonSchemaVersion),bundleSource:it("string","QuerySnapshot"),bundleName:it("string"),bundle:it("string")};class Jf extends Xf{constructor(t){super(),this.firestore=t}convertBytes(t){return new Nt(t)}convertReference(t){const e=this.convertDocumentKey(t,this.firestore._databaseId);return new wt(this.firestore,null,e)}}function Zf(r,t,e){const n=e.docs.get(t._key),i=new Jf(r);return new fe(r,i,t._key,n,new on(e.hasPendingWrites,e.fromCache),t.converter)}(function(t,e=!0){(function(i){Le=i})(Ml),Jn(new fn("firestore",(n,{instanceIdentifier:i,options:o})=>{const c=n.getProvider("app").getImmediate(),l=new Rc(new Jl(n.getProvider("auth-internal")),new eh(c,n.getProvider("app-check-internal")),function(f,_){if(!Object.prototype.hasOwnProperty.apply(f.options,["projectId"]))throw new x(P.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new yn(f.options.projectId,_)}(c,i),c);return o={useFetchStreams:e,...o},l._setSettings(o),l},"PUBLIC").setMultipleInstances(!0)),Ce(po,_o,t),Ce(po,_o,"esm2020")})();const tm={apiKey:"AIzaSyANSk1PwPkMabX6kRGOYnldoeEC8VvtB5Q",authDomain:"ai-resume-f9b01.firebaseapp.com",projectId:"ai-resume-f9b01",storageBucket:"ai-resume-f9b01.firebasestorage.app",messagingSenderId:"836466410766",appId:"1:836466410766:web:146188f9d00106ea1d835f"},em=lo().length===0?Ea(tm):lo()[0],Zr=zf(em),ts="https://ai-resume-git-feature-9d1c2b-gopalakrishnachennu-5461s-projects.vercel.app",bc=document.getElementById("not-connected"),Vc=document.getElementById("connected"),es=document.getElementById("connect-btn"),St=document.getElementById("fill-btn"),ve=document.getElementById("refresh-btn"),ns=document.getElementById("settings-btn");document.getElementById("dashboard-btn");const nm=document.getElementById("user-name"),rm=document.getElementById("user-email"),sm=document.getElementById("user-avatar"),im=document.getElementById("avatar-letter"),Dc=document.getElementById("stat-filled");document.getElementById("stat-accuracy");const Nc=document.getElementById("stat-apps");let k=null,me=null;async function om(){var t;console.log("[Popup] Initializing with Firebase sync...");const r=await chrome.storage.local.get(["auth","stats"]);(t=r.auth)!=null&&t.uid?(me=r.auth.uid,console.log("[Popup] Found userId:",me),await ti(me),xc(r.auth,k,r.stats)):(console.log("[Popup] No userId in storage - showing not connected"),am()),cm()}async function ti(r){var t,e,n,i,o,c,l,d,f,_,v,R,S,N,M,D,Q,H,G,tt,gt,J,E,m,p,T,y,w;try{console.log("[Popup] Loading data from Firebase for:",r);const g=await Jr(Yr(Zr,"activeSession",r));if(g.exists()){k=g.data(),console.log("[Popup] ✅ Sess loaded:",k.jobCompany);const Mt={identity:{firstName:((t=k.personalInfo)==null?void 0:t.firstName)||"",lastName:((e=k.personalInfo)==null?void 0:e.lastName)||"",fullName:((n=k.personalInfo)==null?void 0:n.fullName)||"",email:((i=k.personalInfo)==null?void 0:i.email)||"",phone:((o=k.personalInfo)==null?void 0:o.phone)||"",location:{address:((c=k.personalInfo)==null?void 0:c.location)||"",city:((l=k.personalInfo)==null?void 0:l.city)||"",state:((d=k.personalInfo)==null?void 0:d.state)||"",country:((f=k.personalInfo)==null?void 0:f.country)||"",zip:""},linkedin:((_=k.personalInfo)==null?void 0:_.linkedin)||"",github:((v=k.personalInfo)==null?void 0:v.github)||"",portfolio:((R=k.personalInfo)==null?void 0:R.portfolio)||"",website:((S=k.personalInfo)==null?void 0:S.otherUrl)||""},authorization:{workAuth:((N=k.extensionSettings)==null?void 0:N.workAuthorization)||"citizen",needSponsor:((M=k.extensionSettings)==null?void 0:M.requireSponsorship)==="true",willingToRelocate:((D=k.extensionSettings)==null?void 0:D.willingToRelocate)==="true",securityClearance:((Q=k.extensionSettings)==null?void 0:Q.securityClearance)||""},role:{salaryMin:((H=k.extensionSettings)==null?void 0:H.salaryMin)||0,startDate:((G=k.extensionSettings)==null?void 0:G.expectedJoiningDate)||"",noticePeriod:((tt=k.extensionSettings)==null?void 0:tt.noticePeriod)||""},compliance:{gender:((gt=k.extensionSettings)==null?void 0:gt.gender)||"",ethnicity:((J=k.extensionSettings)==null?void 0:J.ethnicity)||"",veteran:((E=k.extensionSettings)==null?void 0:E.veteranStatus)||"",disability:((m=k.extensionSettings)==null?void 0:m.disabilityStatus)||""},education:{history:k.education||[]},experience:{history:k.experience||[],currentCompany:(T=(p=k.experience)==null?void 0:p[0])!=null&&T.current?k.experience[0].company:"",currentTitle:(w=(y=k.experience)==null?void 0:y[0])!=null&&w.current?k.experience[0].title:""},skills:k.skills||{}};await chrome.storage.local.set({session:k,profile:Mt})}else console.log("[Popup] No active session");let ut=(k==null?void 0:k.extensionSettings)||{},lt=ut.groqApiKeys||ut.groqApiKey,Ct={};if(!lt){const Mt=await Jr(Yr(Zr,"users",r,"settings","extension"));Mt.exists()&&(Ct=Mt.data(),lt=Ct.groqApiKeys||Ct.groqApiKey,console.log("[Popup] Loaded user settings"))}if(!lt){const Mt=await Jr(Yr(Zr,"adminSettings","extension"));if(Mt.exists()){const _e=Mt.data();Ct={...Ct,..._e},lt=Ct.groqApiKeys||Ct.groqApiKey,console.log("[Popup] Loaded admin settings (Global Keys)")}}lt&&lt.includes(`
`)&&(lt=lt.split(`
`)[0].trim()),lt?(await chrome.storage.local.set({settings:{...Ct,groqApiKey:lt,groqModel:ut.groqModel||Ct.groqModel||"llama3-8b-8192"}}),console.log("[Popup] ✅ Groq API Key cached")):console.warn("[Popup] ⚠️ No Groq API Key found in settings")}catch(g){console.error("[Popup] Firebase load failed:",g)}}function xc(r,t,e){var o,c;bc.style.display="none",Vc.style.display="flex";const n=r.displayName||((o=t==null?void 0:t.personalInfo)==null?void 0:o.name)||"User",i=r.email||((c=t==null?void 0:t.personalInfo)==null?void 0:c.email)||"";if(nm.textContent=n,rm.textContent=i,r.photoURL?sm.innerHTML=`<img src="${r.photoURL}" alt="${n}">`:im.textContent=n[0].toUpperCase(),e&&(Dc.textContent=e.filledToday||0,Nc.textContent=e.totalFilled||0),t!=null&&t.jobTitle){const l=St.querySelector(".btn-subtitle");l&&(l.textContent=`${t.jobTitle} @ ${t.jobCompany}`)}}function am(){bc.style.display="flex",Vc.style.display="none"}function cm(){var i;es==null||es.addEventListener("click",()=>{chrome.tabs.create({url:ts+"/settings/extension"})}),St==null||St.addEventListener("click",um),ve==null||ve.addEventListener("click",async()=>{if(me){const o=ve.textContent;ve.textContent="...",await ti(me),ve.textContent=o;const c=await chrome.storage.local.get(["auth","stats"]);xc(c.auth,k,c.stats)}else chrome.tabs.create({url:ts+"/settings/extension"})}),ns==null||ns.addEventListener("click",()=>{chrome.tabs.create({url:ts+"/settings/extension"})}),(i=document.getElementById("dashboard-btn"))==null||i.addEventListener("click",()=>{const o=config.webappUrl+"/dashboard";chrome.tabs.create({url:o})});const r=document.getElementById("data-btn"),t=document.getElementById("data-modal"),e=document.getElementById("close-data"),n=document.getElementById("data-content");r&&r.addEventListener("click",()=>{var o,c,l,d,f,_;if(t&&(t.style.display="block"),k&&n){const v=S=>!S||S.length===0?'<span class="empty">None</span>':S.map(N=>{const M=N.title||N.degree||N.name||"Unknown",D=N.company||N.school||N.issuer||"";return`<div class="data-item"><strong>${M}</strong> <span>${D}</span></div>`}).join(""),R=`
                    <div class="data-section">
                        <h4>🎯 Job Context</h4>
                        <div class="data-row">
                            <span>Role:</span> <strong>${k.jobTitle||"N/A"}</strong>
                        </div>
                        <div class="data-row">
                            <span>Company:</span> <strong>${k.jobCompany||"N/A"}</strong>
                        </div>
                    </div>

                    <div class="data-section">
                        <h4>👤 Identity</h4>
                        <div class="data-row"><span>Name:</span> <strong>${((o=k.personalInfo)==null?void 0:o.fullName)||"N/A"}</strong></div>
                        <div class="data-row"><span>Email:</span> <strong>${((c=k.personalInfo)==null?void 0:c.email)||"N/A"}</strong></div>
                        <div class="data-row"><span>Phone:</span> <strong>${((l=k.personalInfo)==null?void 0:l.phone)||"N/A"}</strong></div>
                        <div class="data-row"><span>Loc:</span> <strong>${((d=k.personalInfo)==null?void 0:d.location)||"N/A"}</strong></div>
                    </div>

                    <div class="data-section">
                        <h4>💼 Experience (${((f=k.experience)==null?void 0:f.length)||0})</h4>
                        ${v(k.experience)}
                    </div>

                    <div class="data-section">
                        <h4>🎓 Education (${((_=k.education)==null?void 0:_.length)||0})</h4>
                        ${v(k.education)}
                    </div>

                    <div class="data-section">
                        <h4>🛠 Skills</h4>
                        <div class="data-row">
                            <span style="font-size:10px; color:#666;">${Object.values(k.skills||{}).flat().join(", ")||"None"}</span>
                        </div>
                    </div>
                `;n.innerHTML=R,n.style.whiteSpace="normal"}else n&&(n.innerHTML='<div class="empty-state-small">⚠️ No Active Session Data.<br>Please go to Dashboard and click ⚡ Flash on a resume.</div>')}),e&&e.addEventListener("click",()=>{t&&(t.style.display="none")})}async function um(){const r=St.querySelector(".btn-title"),t=St.querySelector(".btn-icon"),e=r.textContent,n=t.textContent;St.classList.add("loading"),r.textContent="Filling...",t.textContent="↻";try{me&&await ti(me);const o=await chrome.storage.local.get(["profile","session"]);if(console.log("[Popup] Fill with data:",o),!o.profile&&!o.session){i(),r.textContent="No session - Flash first!",setTimeout(()=>{r.textContent=e},2e3);return}const[c]=await chrome.tabs.query({active:!0,currentWindow:!0});if(!(c!=null&&c.id)){i(),r.textContent="No active tab",setTimeout(()=>{r.textContent=e},2e3);return}chrome.tabs.sendMessage(c.id,{type:"FILL_FORM"},l=>{if(St.classList.remove("loading"),chrome.runtime.lastError){r.textContent="Please Refresh Page",t.textContent="↻",setTimeout(()=>{r.textContent=e,t.textContent=n},3e3);return}l!=null&&l.success?(St.classList.add("success"),r.textContent="Filled "+(l.filled||0)+" Fields!",t.textContent="✓",lm(l.filled||0),setTimeout(()=>{St.classList.remove("success"),r.textContent=e,t.textContent=n},3e3)):(r.textContent=(l==null?void 0:l.error)||"No forms found",t.textContent="⚠",setTimeout(()=>{r.textContent=e,t.textContent=n},2500))})}catch(o){console.error("[Popup] Fill error:",o),i()}function i(){St.classList.remove("loading"),r.textContent=e,t.textContent=n}}async function lm(r){try{const e=(await chrome.storage.local.get(["stats"])).stats||{filledToday:0,totalFilled:0};e.filledToday=(e.filledToday||0)+r,e.totalFilled=(e.totalFilled||0)+r,await chrome.storage.local.set({stats:e}),Dc.textContent=e.filledToday,Nc.textContent=e.totalFilled}catch(t){console.error("[Popup] Update stats failed:",t)}}document.addEventListener("DOMContentLoaded",om);
