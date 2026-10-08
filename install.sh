#!/usr/bin/env bash
set -Eeuo pipefail

# Public distribution template. Never publish until PINNED_KEY is configured,
# a signed release exists and macOS/Linux acceptance tests have passed.
die(){ printf '\nSyntheon Local installer: %s\n' "$*" >&2; exit 1; }
command -v node >/dev/null 2>&1 || die "Node.js 22+ is required. Get it from https://nodejs.org/en/download"
node -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 22 ? 0 : 1)' ||
  die "Node.js 22+ is required."
command -v tar >/dev/null 2>&1 || die "tar is required"
[[ "$(id -u)" != "0" ]] || die "Do not run this installer as root or with sudo."

# Deliberately absent until secure publisher signing is commissioned.
# No environment override can bypass this trust check.
PINNED_KEY='UNCONFIGURED_RELEASE_ED25519_PUBLIC_KEY'
[[ "$PINNED_KEY" != UNCONFIGURED* ]] ||
  die "Public signed releases are not yet available. The private Ubuntu pilot is separate."

ORIGIN='https://syntheon-local.vercel.app'
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT
export SYNTHEON_BOOTSTRAP_WORKDIR="$WORKDIR"
export SYNTHEON_BOOTSTRAP_ORIGIN="$ORIGIN"
export SYNTHEON_BOOTSTRAP_PUBKEY="$PINNED_KEY"

# Only download signed artifacts from the exact official origin, no redirects.
node --input-type=module <<'VERIFY_AND_DOWNLOAD'
import {createHash,verify} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
const fail=message=>{throw new Error(message)};
const dir=process.env.SYNTHEON_BOOTSTRAP_WORKDIR;
const origin=process.env.SYNTHEON_BOOTSTRAP_ORIGIN;
const key=process.env.SYNTHEON_BOOTSTRAP_PUBKEY;
async function boundedFetch(url,maxBytes){
  if(new URL(url).origin!==origin)fail('Unexpected release origin.');
  const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(30000)});
  if(!r.ok)fail('Release download failed: HTTP '+r.status);
  if(Number(r.headers.get('content-length')||0)>maxBytes)fail('Oversize response.');
  const parts=[];let size=0;
  for await(const part of r.body){size+=part.length;if(size>maxBytes)fail('Download exceeded size bound.');parts.push(part);}
  return Buffer.concat(parts);
}
const signed=await boundedFetch(origin+'/api/releases/v1/manifest',200000);
const detached=await boundedFetch(origin+'/api/releases/v1/manifest.sig',10000);
const sig=Buffer.from(detached.toString('utf8').trim(),'base64');
if(sig.length!==64||!verify(null,signed,key,sig))fail('Publisher Ed25519 signature invalid.');
const m=JSON.parse(signed.toString('utf8'));
if(m.schemaVersion!==1||typeof m.releaseVersion!=='string'||!Array.isArray(m.artifacts))fail('Invalid manifest.');
const target=process.platform+'-'+process.arch;
const files=m.artifacts.filter(a=>a.target===target);
if(files.length!==1)fail('No unique supported signed artifact for '+target);
const a=files[0];
if(!/^([a-f0-9]{64})$/.test(a.sha256)||!Number.isSafeInteger(a.bytes)||
   a.bytes<1||a.bytes>100_000_000)fail('Invalid artifact attributes.');
const u=new URL(a.url);
if(u.protocol!=='https:'||u.origin!==origin)fail('Unapproved artifact download origin.');
const data=await boundedFetch(u.toString(),a.bytes);
if(data.length!==a.bytes||createHash('sha256').update(data).digest('hex')!==a.sha256)
  fail('Signed artifact length or SHA-256 mismatch.');
await fs.writeFile(path.join(dir,'release.tar.gz'),data,{mode:0o600});
VERIFY_AND_DOWNLOAD

# A signed archive must still have safe extractable member paths.
node --input-type=module <<'CHECK_ARCHIVE'
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
const p=process.env.SYNTHEON_BOOTSTRAP_WORKDIR+'/release.tar.gz';
const tar=gunzipSync(fs.readFileSync(p),{maxOutputLength:150_000_000});
let offset=0,count=0;
while(offset+512<=tar.length){
 const header=tar.subarray(offset,offset+512);
 if(header.every(b=>b===0))break;
 const name=header.subarray(0,100).toString('utf8').replace(/\0.*$/,'');
 const type=String.fromCharCode(header[156]);
 const prefix=header.subarray(345,500);
 if(prefix.some(b=>b!==0))throw Error('Unexpected tar path prefix');
 const sizeText=header.subarray(124,136).toString('utf8').replace(/\0.*$/,'').trim();
 const size=parseInt(sizeText,8);
 if(!name.startsWith('syntheon-local-pilot/')||name.includes('..')||name.includes('\\')||
   name.startsWith('/')||!['0','5','\0'].includes(type)||!Number.isSafeInteger(size)||size<0)
   throw Error('Unsafe archive entry: '+name);
 offset+=512+Math.ceil(size/512)*512;
 if(offset>tar.length)throw Error('Truncated archive');
 count++;
 if(count>200)throw Error('Too many archive entries');
}
if(!count)throw Error('Empty release archive');
CHECK_ARCHIVE

tar -xzf "$WORKDIR/release.tar.gz" -C "$WORKDIR" ||
  die "Verified release could not be extracted."
cd "$WORKDIR/syntheon-local-pilot"
node scripts/verify-pilot.mjs || die "Release manifest verification failed."
DEFAULT_ROOT="$HOME/Syntheon-Workspace"
printf 'Trusted folder [default %s]: ' "$DEFAULT_ROOT" >&2
IFS= read -r CHOSEN_ROOT </dev/tty || die "Local approval requires a terminal."
ROOT="$CHOSEN_ROOT"
if [[ -z "$ROOT" ]]; then ROOT="$DEFAULT_ROOT"; fi
[[ "$ROOT" == /* && "$ROOT" != '/' ]] || die "Choose an absolute, non-root trusted directory."
mkdir -p "$ROOT"
node scripts/install-dev.mjs --root "$ROOT" --mode read_only --dry-run
printf 'Install this read-only runtime and begin human-approved device pairing? [y/N] ' >&2
IFS= read -r CONFIRM </dev/tty || die "Terminal approval required."
[[ "$CONFIRM" == "y" || "$CONFIRM" == "Y" ]] || die "Installation cancelled."
node scripts/install-dev.mjs --root "$ROOT" --mode read_only
node "$HOME/.local/bin/syntheon-local-agent.mjs" connect
