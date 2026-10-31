import {build} from 'esbuild';
import fs from 'node:fs/promises';
for(const name of ['app-test','flow-test'])await build({entryPoints:[name+'.jsx'],outfile:name+'.cjs',bundle:true,format:'cjs',platform:'node',jsx:'automatic',define:{'import.meta.env':'{}'},nodePaths:['../../node_modules'],plugins:[{name:'glob',setup(b){b.onLoad({filter:/DoctorAdmin\.jsx$/},async args=>({contents:(await fs.readFile(args.path,'utf8')).replace(/import\.meta\.glob\([^)]*\)/g,'({})'),loader:'jsx'}));}}],loader:{'.jpg':'dataurl'}});
