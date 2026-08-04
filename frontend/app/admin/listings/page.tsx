"use client";

import AddListingModal from "@/components/admin/listings/AddListingModal";
import ListingTable from "@/components/admin/listings/ListingTable";
import { useCallback, useEffect, useState } from "react";
import { CreateListingDto, Listing } from "@/lib/types";
import { getListings, saveListing, deleteListing } from "@/lib/api/listings";
import ConfirmDialog from "@/components/ConfirmDialog";
import ViewListingModal from "@/components/admin/listings/ViewListingModal";

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isAddListingOpen, setIsAddListingOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = (id: number) => {
    setListingToDelete(id);
  };

  const confirmDelete = async () => {
    if (listingToDelete === null) return;

    try {
      setDeleting(true);

      await deleteListing(listingToDelete);
      await fetchListings();

      setListingToDelete(null);
    } finally {
      setDeleting(false);
    }
  };


  const cancelDelete = () => {
    setListingToDelete(null);
  };

   const handleView = (listing: Listing) => {
    setSelectedListing(listing);
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleSave = async (listing: CreateListingDto) => {

    const response = await saveListing(listing);
    console.log(response);
    fetchListings();
    setIsAddListingOpen(false);
  };

  const fetchListings = useCallback(async () => {
    const data = await getListings();
    setListings(data);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Listings</h1>

      <ListingTable
        onDelete={handleDelete}
        listings={listings}
        onAddListing={() => setIsAddListingOpen(true)}
        onView={handleView}
      />

      <AddListingModal
        isOpen={isAddListingOpen}
        onClose={() => setIsAddListingOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDialog
        isOpen={listingToDelete !== null}
        title="Delete Listing"
        message="Are you sure you want to delete this listing? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <ViewListingModal
        isOpen={selectedListing !== null}
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
      />
    </div>
  );
}
