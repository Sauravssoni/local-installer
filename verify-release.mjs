#!/usr/bin/env node
// Offline verification of a Syntheon Local release artifact.
// Trust only a publisher public key authenticated independently of the archive.
// This tool never downloads or executes the payload.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

export function verifyRelease({manifestBytes,signature,publisherKey,artifactBytes,target}){
  const key=publisherKey instanceof crypto.KeyObject ? publisherKey : crypto.createPublicKey(publisherKey);
  if(key.asymmetricKeyType!=='ed25519')throw Error('Publisher verification key must be Ed25519.');
  if(!Buffer.isBuffer(signature)||signature.length!==64||
     !crypto.verify(null,manifestBytes,key,signature))throw Error('Invalid publisher signature.');
  let m;try{m=JSON.parse(manifestBytes.toString('utf8'))}catch{throw Error('Invalid signed JSON manifest.')}
  if(m.schemaVersion!==1||!Array.isArray(m.artifacts)||!Number.isSafeInteger(m.artifacts.length)||
     m.artifacts.length<1||m.artifacts.length>16)
    throw Error('Unsupported release manifest schema.');
  if(typeof target!=='string'||!/^(?:darwin|linux)-(?:arm64|x64)$/.test(target))
    throw Error('Unsupported target.');
  const matches=m.artifacts.filter(a=>a.target===target);
  if(matches.length!==1)throw Error('Missing or ambiguous target.');
  const a=matches[0];
  if(!/^([a-f0-9]{64})$/.test(a.sha256)||!Number.isSafeInteger(a.bytes)||
    a.bytes<1||a.bytes>100_000_000)throw Error('Invalid signed file metadata.');
  if(!Buffer.isBuffer(artifactBytes)||artifactBytes.length!==a.bytes)
    throw Error('Artifact byte count mismatch.');
  const calculated=crypto.createHash('sha256').update(artifactBytes).digest('hex');
  if(calculated!==a.sha256)throw Error('Artifact SHA-256 mismatch.');
  return {ok:true,version:m.releaseVersion,keyId:m.signingKeyId,
    target,bytes:a.bytes,sha256:calculated};
}

async function main(){
  const args=process.argv.slice(2);
  const arg=k=>{const i=args.indexOf(k);return i<0?null:args[i+1]};
  const source=arg('--manifest'),sig=arg('--signature'),pub=arg('--public-key'),
    artifact=arg('--artifact'),target=arg('--target')||process.platform+'-'+process.arch;
  if(!source||!sig||!pub||!artifact)throw Error(
    'Usage: verify-release.mjs --manifest manifest --signature manifest.sig --public-key pinned-publisher.pem --artifact release.tar.gz [--target linux-x64]');
  const [manifestBytes,signatureText,publisherKey,artifactBytes]=await Promise.all([
    fs.readFile(source),fs.readFile(sig,'utf8'),fs.readFile(pub),fs.readFile(artifact)
  ]);
  if(manifestBytes.length>200_000||signatureText.length>1000||publisherKey.length>10000||
     artifactBytes.length>100_000_000)throw Error('Release verification inputs exceed limits.');
  const signature=Buffer.from(signatureText.trim(),'base64');
  console.log(JSON.stringify(verifyRelease({manifestBytes,signature,publisherKey,artifactBytes,target})));
}

if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
  main().catch(e=>{console.error('Syntheon release rejected: '+e.message);process.exitCode=1});
}
