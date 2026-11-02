"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CollectionItem, collectionsService } from "@/services/collections";
import { CollectionForm } from "../../components/CollectionForm";

export default function EditCollectionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [collection, setCollection] = useState<CollectionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    collectionsService
      .getCollection(id)
      .then((data) => {
        setCollection(data);
      })
      .catch((err: any) => {
        setError(err?.message || "Failed to load collection details.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="container-fluid p-5 text-center text-muted">
        <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
        Loading collection details...
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-danger rounded-4 p-4 text-center">
          <i className="bi bi-exclamation-triangle-fill display-6 text-danger mb-2 d-block" />
          <h5 className="fw-bold">Collection Not Found</h5>
          <p className="text-muted small mb-3">{error || "Could not retrieve collection with this ID."}</p>
          <Link href="/catalog/collections" className="btn btn-outline-secondary rounded-3">
            Back to Collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <CollectionForm initialData={collection} isEditing={true} />
    </div>
  );
}
