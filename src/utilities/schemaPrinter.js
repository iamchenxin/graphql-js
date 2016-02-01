/* @flow */
/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import invariant from '../jsutils/invariant';
import isNullish from '../jsutils/isNullish';
import { astFromValue } from '../utilities/astFromValue';
import { print } from '../language/printer';
import type { GraphQLSchema } from '../type/schema';
import type { GraphQLType } from '../type/definition';
import {
  GraphQLScalarType,
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLList,
} from '../type/definition';


export function printSchema(schema: GraphQLSchema): string {
  return printFilteredSchema(schema, isDefinedType);
}

export function printIntrospectionSchema(schema: GraphQLSchema): string {
  return printFilteredSchema(schema, isIntrospectionType);
}

export function printFineSchema(schema: GraphQLSchema): string {

  let orderedNames =getOrderedNamesBySchema(schema);

  console.log(orderedNames);

  const typeMap = schema.getTypeMap();
  let types =orderedNames.map(orderedName => typeMap[orderedName]);
  return types.map(printType).join('\n\n') + '\n';

}

function getOrderedNamesBySchema(schema){
  const typeMap = schema.getTypeMap();
  const rootQuery=schema.getQueryType();
  const definedTypeNames=Object.keys(typeMap).filter(isDefinedType);

  const typeNamesMap=arrayToMap(definedTypeNames,99999);

  let {unLeveledNamesMap,leveledNamesMap} = levelTypeNames(rootQuery.name,typeNamesMap,typeMap);
  console.log(leveledNamesMap);
  let orderedNames = getOrderedNamesFromMap(leveledNamesMap);

  const rootMutation=schema.getMutationType();
  if(rootMutation){
    let {unLeveledNamesMap:unleveledMuatationNameMaps,leveledNamesMap:leveledMuatationNameMaps}
      = levelTypeNames(rootMutation.name,unLeveledNamesMap,typeMap);
    let orderedMuNames=getOrderedNamesFromMap(leveledMuatationNameMaps);
    orderedNames=[...orderedNames,...orderedMuNames];
    unLeveledNamesMap = unleveledMuatationNameMaps;
  }

  let theNamesIDontKnown = getOrderedNamesFromMap(unLeveledNamesMap);
  if(theNamesIDontKnown.length>0){
    console.log(`these names are unOrdered ${theNamesIDontKnown},maybe they dont be uesd by other types`);
    orderedNames=[...theNamesIDontKnown,...orderedNames];
  }
  return orderedNames;
}

function getOrderedNamesFromMap(leveledNamesMap){
  let levelToNamesMap =  flipMap(leveledNamesMap);
  let nameLevels = [...levelToNamesMap.keys()];
  nameLevels.sort((pre,next)=>(pre<=next));
  let orderedNames=[];
  for(let level of nameLevels){
    let levelNames = levelToNamesMap.get(level);
    levelNames.sort();// sort the same level names . to get a certainly order.
    orderedNames=[...orderedNames,...levelNames];
  }
  return orderedNames;
}

// calculate level values for each type names by their reference to each other
function levelTypeNames(rootName,namesMapToBeLeveled,typeMap){
  let unLeveledNamesMap = new Map(namesMapToBeLeveled);
  let leveledNamesMap= new Map();
  let circleRef=new Map();// use a map to watch circle ref,Depth-first search

  unLeveledNamesMap.delete(rootName);
  leveledNamesMap.set(rootName,0);
  _levelTypeNames(rootName,1);
  function _levelTypeNames(thisName,childLevel){
    let childrenNames=getRefedTypes(typeMap[thisName]);
    for(let childName of childrenNames){
      if(// meet a circle ref,skip
        circleRef.get(childName) ||
        // this type is not belong to current process,skip
        namesMapToBeLeveled.get(childName)==null ||
        //  if [the level of leveled Name] >= [current level]  ,must skip,level is always up~ no downgrade
        (leveledNamesMap.has(childName)&& leveledNamesMap.get(childName)>=childLevel)
      ){
        continue;
      }
      circleRef.set(childName,childLevel);

      leveledNamesMap.set(childName,childLevel);
      unLeveledNamesMap.delete(childName);
      _levelTypeNames(childName,childLevel+1);

      circleRef.delete(childName);
    }
  }


  return {unLeveledNamesMap,leveledNamesMap};
}


// always return an array ,if get none,just return []
// a type or interface ref from (args and resolve) of fields and interface of a type
function getRefedTypes(type){
  let refedTypeNames=[];
  if(!isDefinedType(type.name)){ //only check
    return refedTypeNames;
  }else {
    if( !(type.getFields instanceof Function)){
      // if hasn't `getFields` ,it must not be a class GraphQLObjectType or GraphQLInterfaceType
      // as now,the only types will ref another definedType inside are GraphQLObjectType and GraphQLInterfaceType
      // GraphQLEnumType has no fields
      return refedTypeNames;
    }
  }

  const fields=type.getFields();
  // 1/2 get refed type name from fields
  Object.keys(fields).map(fieldKey=>fields[fieldKey])
    .filter(field=>isDefinedType(getTypeName(field.type) ) )
    .map(field=>{
      refedTypeNames=refedTypeNames.concat(
        // 1 get type name from args of a field
        field.args.map(arg=>getDefinedTypeNameByType(arg.type)).filter(value=>value instanceof String) ,
        // 2 get type name from field itself
        getDefinedTypeNameByType(field.type)|| []
      );
    });

  // 3 get type name from interfaces of the type itself
  if(type.getInterfaces instanceof Function){
    for(let interfaceType of type.getInterfaces()){
      refedTypeNames.push(interfaceType.name);
    }
  }
  return refedTypeNames;

}

function arrayToMap(_array,defaultValue){
  var _map = new Map();
  for (let v of _array){
    _map.set(v,defaultValue);
    console.log(`${v},${_map.get(v)}`);
  }
  return _map;
}

function flipMap(_srcMap){
  let _outMap = new Map();
  for (let [oldKey,vToKey] of _srcMap){
    if(_outMap.has(vToKey)){
      _outMap.get(vToKey).push(oldKey);
    }else{
      _outMap.set(vToKey,[oldKey]);
    }
  }
  return _outMap;
}

function getTypeName(type){
  let name=type.name;
  if(name==null){
    let typeString = type.constructor.name;
    if(typeString == 'GraphQLNonNull' || typeString == 'GraphQLList' ){
      name=type.ofType.name;
    }
    if(name==null){ // still can not get name, so this type is something i dont kown ,throw to learn
      throw new Error(`Unknown type its javascript class is[ [${type.constructor.name}] ${type.ofType.constructor.name}]`);
    }
  }
  return name;
}

function getDefinedTypeNameByType(TypeObj:any):?string{

  let typeName=getTypeName(TypeObj);
  if(isDefinedType(typeName)){
    return typeName;
  }else {
    return null;
  }
}



function isDefinedType(typename: string): boolean {
  return !isIntrospectionType(typename) && !isBuiltInScalar(typename);
}

function isIntrospectionType(typename: string): boolean {
  return typename.indexOf('__') === 0;
}

function isBuiltInScalar(typename: string): boolean {
  return (
    typename === 'String' ||
    typename === 'Boolean' ||
    typename === 'Int' ||
    typename === 'Float' ||
    typename === 'ID'
  );
}

function printFilteredSchema(
  schema: GraphQLSchema,
  typeFilter: (type: string) => boolean
): string {
  const typeMap = schema.getTypeMap();
  const types = Object.keys(typeMap)
    .filter(typeFilter)
    .sort((name1, name2) => name1.localeCompare(name2))
    .map(typeName => typeMap[typeName]);
  return types.map(printType).join('\n\n') + '\n';
}

function printType(type: GraphQLType): string {
  if (type instanceof GraphQLScalarType) {
    return printScalar(type);
  } else if (type instanceof GraphQLObjectType) {
    return printObject(type);
  } else if (type instanceof GraphQLInterfaceType) {
    return printInterface(type);
  } else if (type instanceof GraphQLUnionType) {
    return printUnion(type);
  } else if (type instanceof GraphQLEnumType) {
    return printEnum(type);
  }
  invariant(type instanceof GraphQLInputObjectType);
  return printInputObject(type);
}

function printScalar(type: GraphQLScalarType): string {
  return `scalar ${type.name}`;
}

function printObject(type: GraphQLObjectType): string {
  const interfaces = type.getInterfaces();
  const implementedInterfaces = interfaces.length ?
    ' implements ' + interfaces.map(i => i.name).join(', ') : '';
  return `type ${type.name}${implementedInterfaces} {\n` +
    printFields(type) + '\n' +
  '}';
}

function printInterface(type: GraphQLInterfaceType): string {
  return `interface ${type.name} {\n` +
    printFields(type) + '\n' +
  '}';
}

function printUnion(type: GraphQLUnionType): string {
  return `union ${type.name} = ${type.getPossibleTypes().join(' | ')}`;
}

function printEnum(type: GraphQLEnumType): string {
  const values = type.getValues();
  return `enum ${type.name} {\n` +
    values.map(v => '  ' + v.name).join('\n') + '\n' +
  '}';
}

function printInputObject(type: GraphQLInputObjectType): string {
  const fieldMap = type.getFields();
  const fields = Object.keys(fieldMap).map(fieldName => fieldMap[fieldName]);
  return `input ${type.name} {\n` +
    fields.map(f => '  ' + printInputValue(f)).join('\n') + '\n' +
  '}';
}

function printFields(type) {
  const fieldMap = type.getFields();
  const fields = Object.keys(fieldMap).map(fieldName => fieldMap[fieldName]);
  return fields.map(
    f => `  ${f.name}${printArgs(f)}: ${f.type}`
  ).join('\n');
}

function printArgs(field) {
  if (field.args.length === 0) {
    return '';
  }
  return '(' + field.args.map(printInputValue).join(', ') + ')';
}

function printInputValue(arg) {
  let argDecl = `${arg.name}: ${arg.type}`;
  if (!isNullish(arg.defaultValue)) {
    argDecl += ` = ${print(astFromValue(arg.defaultValue, arg.type))}`;
  }
  return argDecl;
}
