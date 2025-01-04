/* @ shelljs */
/*
import * as shell from 'shelljs';

shell.cp('-R', 'src/emails', 'build/src/');
*/

/* @ fs-extra */
/*
import fs from 'fs-extra';

fs.copySync('src/emails', 'build/src/emails');
*/

/*
import * as fse from 'fs-extra';

fse.copySync('src/emails', 'build/src/emails');
*/

import * as path from 'path';

import * as fse from 'fs-extra';

// Ensure directories exist
const srcDir = path.resolve(__dirname, '../src/emails');
const buildDir = path.resolve(__dirname, '../build/emails');

try {
  // Ensure build directory exists
  fse.ensureDirSync(path.dirname(buildDir));

  // Copy the directory
  fse.copySync(srcDir, buildDir, {
    overwrite: true,
    errorOnExist: false
  });

  console.log('Successfully copied src/emails directory to /build');
} catch (err) {
  console.error('Error copying src/emails directory to /build:', err);
  process.exit(1);
}
