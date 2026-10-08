import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,verify,createHash} from 'node:crypto';

// Ephemeral TEST keys. No publisher signing material is embedded in public source.
test('detached Ed25519 manifest signature is valid only for exact bytes',()=>{
  const {publicKey,privateKey}=generateKeyPairSync('ed25519');
  const bytes=Buffer.from('{"schemaVersion":1,"releaseVersion":"0.4.0-dev"}\n','utf8');
  const signature=sign(null,bytes,privateKey);
  assert.equal(signature.length,64);
  assert.equal(verify(null,bytes,publicKey,signature),true);
  assert.equal(verify(null,Buffer.from(bytes.toString().trim()),publicKey,signature),false);
  const changed=Buffer.from(bytes);
  changed[10]^=1;
  assert.equal(verify(null,changed,publicKey,signature),false);
  const {publicKey:other}=generateKeyPairSync('ed25519');
  assert.equal(verify(null,bytes,other,signature),false);
});

test('exact payload SHA-256 and length detect tampering',()=>{
  const bytes=Buffer.from('temporary release test bytes','utf8');
  const expected={bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
  assert.equal(bytes.length,expected.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),expected.sha256);
  assert.notEqual(createHash('sha256').update(Buffer.concat([bytes,Buffer.from('!')])).digest('hex'),expected.sha256);
});
