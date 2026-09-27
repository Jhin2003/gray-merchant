"use client";

import AddListingModal from "@/components/admin/listings/AddListingModal";
import ListingTable from "@/components/admin/listings/ListingTable";
import { useCallback, useEffect, useState } from "react";
import { CreateListingDto, Listing } from "@/lib/types";
import {
  getListings,
  saveListing,
  deleteListing,
  updateListing,
} from "@/lib/api/listings";
import ConfirmDialog from "@/components/ConfirmDialog";
import ViewListingModal from "@/components/admin/listings/ViewListingModal";
import EditListingModal from "@/components/admin/listings/EditListingModal";
import { showToast } from "@/components/Toast";


export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isAddListingOpen, setIsAddListingOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<number | null>(null);
  const [listingToEdit, setListingToEdit] = useState<Listing | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });

  const fetchListings = useCallback(async () => {
    const data = await getListings(page, pageSize);
    setListings(data.data);

    setPagination({
      total: data.pagination.total,
      totalPages: data.pagination.totalPages,
    });
  }, [page, pageSize]);

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

  const handleEdit = (listing: Listing) => {
    setListingToEdit(listing);
  };

  const handleAddListing = () => {
    setIsAddListingOpen(true);
  };

  const handleSave = async (listing: CreateListingDto) => {
    const response = await saveListing(listing);
    if (response) {
      showToast("Listing added successfully!", "success");
      console.log(response);
      fetchListings();
      setIsAddListingOpen(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);
  const handleUpdate = async (updatedListing: Listing) => {
    try {
      // Pass the ID and the updated data to your backend
      await updateListing(updatedListing.id, updatedListing);

      // Refresh the table data
      await fetchListings();

      // Close the modal
      setListingToEdit(null);
    } catch (error) {
      console.error("Failed to update listing:", error);
      // Optional: Add a toast notification here to show the error
    }
  };
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Listings</h1>

      <ListingTable
        listings={listings}
        page={page}
        pageSize={pageSize}
        totalPages={pagination.totalPages}
        totalItems={pagination.total}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPage(1);
          setPageSize(size);
        }}
        onAddListing={handleAddListing}
        onDelete={handleDelete}
        onView={handleView}
        onEdit={handleEdit}
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

      <EditListingModal
        isOpen={listingToEdit !== null}
        listing={listingToEdit}
        onClose={() => setListingToEdit(null)}
        onSave={handleUpdate}
      />
    </div>
  );
}
