import * as whatsapp from "wa-multi-session";

const keys = Object.keys(whatsapp);
const downloadKeys = keys.filter(k => k.toLowerCase().includes('download'));
console.log('Download keys:', downloadKeys);
