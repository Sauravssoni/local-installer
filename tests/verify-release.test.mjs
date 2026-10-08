import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {verifyRelease} from '../verify-release.mjs';

test('offline verifier requires an independent publisher signature',()=>{
  const {privateKey,publicKey}=crypto.generateKeyPairSync('ed25519');
  const artifact=Buffer.from('verified local-runtime preview');
  const digest=crypto.createHash('sha256').update(artifact).digest('hex');
  const m={schemaVersion:1,releaseVersion:'0.4.0-rc.1',signingKeyId:'staging-only',
    artifacts:[{target:'linux-x64',bytes:artifact.length,sha256:digest}]};
  const raw=Buffer.from(JSON.stringify(m)+'\n');
  const sig=crypto.sign(null,raw,privateKey);
  const input={manifestBytes:raw,signature:sig,publisherKey:publicKey,
    artifactBytes:artifact,target:'linux-x64'};
  assert.equal(verifyRelease(input).ok,true);
  assert.throws(()=>verifyRelease({...input,artifactBytes:Buffer.from('tampered release')}),/mismatch/);
  assert.throws(()=>verifyRelease({...input,signature:Buffer.alloc(64)}),/signature/);
  assert.throws(()=>verifyRelease({...input,manifestBytes:Buffer.from(raw.toString().trim())}),/signature/);
  assert.throws(()=>verifyRelease({...input,target:'darwin-arm64'}),/target/);
  assert.throws(()=>verifyRelease({...input,publisherKey:crypto.generateKeyPairSync('ed25519').publicKey}),/signature/);
  assert.throws(()=>verifyRelease({...input,signature:Buffer.alloc(4)}),/signature/);
});
