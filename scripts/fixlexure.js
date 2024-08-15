import LexurePackage from '../node_modules/lexure/package.json' assert { type: 'json' };
import { writeFileSync } from 'node:fs'

const typePath = LexurePackage.typings
LexurePackage.exports.types = `./${typePath}`;

writeFileSync('./node_modules/lexure/package.json', JSON.stringify(LexurePackage));

