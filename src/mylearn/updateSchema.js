/**
 * Created by iamchenxin on 15-12-7.
 */
import fs from 'fs';
import path from 'path';
import { introspectionQuery, printSchema ,printFineSchema} from '../utilities/schemaPrinter.js';


//
function updateSchema(schemaPath,dst){
    var srcPath=path.resolve(schemaPath);
    var basename=path.basename(srcPath,".js");
    var dstPath_noExt=path.resolve(dst,basename);
    console.log(`srcPath=[${srcPath}] , dstPath_noExt=[${dstPath_noExt}]`);

    var mySchema=require(srcPath).schema;
 //   console.log(mySchema);

    // Save user readable type system shorthand of schema

    fs.writeFileSync(
      dstPath_noExt+".graphql",
      printFineSchema(mySchema,{
          rootQueryName:"Query",rootMutationName:null
      })
    );



}

updateSchema(path.resolve(__dirname,'./starWarsSchema.js'),path.resolve(__dirname));

module.exports = updateSchema;