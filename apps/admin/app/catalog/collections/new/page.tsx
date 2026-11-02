"use client";

import React from "react";
import { CollectionForm } from "../components/CollectionForm";

export default function NewCollectionPage() {
  return (
    <div className="container-fluid p-4">
      <CollectionForm isEditing={false} />
    </div>
  );
}

