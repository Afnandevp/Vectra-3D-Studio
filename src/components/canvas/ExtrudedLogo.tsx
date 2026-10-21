import React from 'react';
import * as THREE from 'three';
import { SvgMesh } from './SvgMesh';

export let logoMeshObject: THREE.Mesh | null = null;

export const ExtrudedLogo: React.FC = () => {
  return (
    <SvgMesh
      onMeshReady={(mesh) => {
        logoMeshObject = mesh;
      }}
    />
  );
};

