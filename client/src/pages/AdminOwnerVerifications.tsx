import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiUsers, 
  FiClock, 
  FiCheckCircle, 
  FiXCircle, 
  FiEye,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiFileText,
  FiImage,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { format } from 'date-fns';

interface VerificationDocument {
  url: string;
  publicId: string;
  uploadedAt: string;
}

interface Owner {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  propertyName?: string;
  propertyCount?: string;
  businessAddress?: string;
  gstNumber?: string;
  ownerVerificationStatus: 'pending' | 'under_review' | 'verified' | 'rejected';
  verificationDocuments?: {
    governmentId?: VerificationDocument;
    propertyProof?: VerificationDocument;
    businessRegistration?: VerificationDocument;
  };
  verificationSubmittedAt?: string;
  verificationReviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

interface StatusCounts {
  pending: number;
  under_review: number;
  verified: number;
  rejected: number;
}

const AdminOwnerVerifications: React.FC = () => {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    pending: 0,
    under_review: 0,
    verified: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch owner verifications
  const fetchOwners = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        status: activeFilter,
        page: currentPage.toString(),
        limit: '10'
      });

      const response = await fetch(
        `${API_URL}/api/admin/owner-verifications?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch owner verifications');
      }

      const data = await response.json();
      
      if (data.success) {
        setOwners(data.owners);
        setStatusCounts(data.statusCounts);
        setTotalPages(data.pagination.pages);
      } else {
        throw new Error(data.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [API_URL, activeFilter, currentPage]);

  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  // Get owner details
  const fetchOwnerDetails = async (ownerId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/admin/owner-verifications/${ownerId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch owner details');
      }

      const data = await response.json();
      if (data.success) {
        setSelectedOwner(data.owner);
        setShowModal(true);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error fetching details');
    }
  };

  // Mark as under review
  const handleMarkUnderReview = async (ownerId: string) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/admin/owner-verifications/${ownerId}/review`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        fetchOwners();
        setShowModal(false);
        setSelectedOwner(null);
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      alert('Error updating status');
    } finally {
      setActionLoading(false);
    }
  };

  // Approve owner
  const handleApprove = async (ownerId: string) => {
    if (!confirm('Are you sure you want to APPROVE this owner?')) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/admin/owner-verifications/${ownerId}/approve`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ notes: 'Approved via admin panel' })
        }
      );

      const data = await response.json();
      if (data.success) {
        alert('✅ Owner approved successfully!');
        fetchOwners();
        setShowModal(false);
        setSelectedOwner(null);
      } else {
        alert(data.message || 'Failed to approve');
      }
    } catch (err) {
      alert('Error approving owner');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject owner
  const handleReject = async () => {
    if (!selectedOwner) return;
    if (rejectionReason.trim().length < 10) {
      alert('Please provide a rejection reason (minimum 10 characters)');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/admin/owner-verifications/${selectedOwner._id}/reject`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason: rejectionReason })
        }
      );

      const data = await response.json();
      if (data.success) {
        alert('❌ Owner rejected');
        fetchOwners();
        setShowModal(false);
        setShowRejectModal(false);
        setSelectedOwner(null);
        setRejectionReason('');
      } else {
        alert(data.message || 'Failed to reject');
      }
    } catch (err) {
      alert('Error rejecting owner');
    } finally {
      setActionLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FiClock className="mr-1" /> Pending
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <FiEye className="mr-1" /> Under Review
          </span>
        );
      case 'verified':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FiCheckCircle className="mr-1" /> Verified
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <FiXCircle className="mr-1" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  // Filter tabs
  const filterTabs = [
    { key: 'pending', label: 'Pending', count: statusCounts.pending, color: 'yellow' },
    { key: 'under_review', label: 'Under Review', count: statusCounts.under_review, color: 'blue' },
    { key: 'verified', label: 'Verified', count: statusCounts.verified, color: 'green' },
    { key: 'rejected', label: 'Rejected', count: statusCounts.rejected, color: 'red' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FiUsers className="mr-3 text-indigo-600" />
            Owner Verification Management
          </h1>
          <p className="mt-2 text-gray-600">
            Review and manage property owner verification requests
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-700">{statusCounts.pending}</p>
              </div>
              <FiClock className="text-3xl text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Under Review</p>
                <p className="text-2xl font-bold text-blue-700">{statusCounts.under_review}</p>
              </div>
              <FiEye className="text-3xl text-blue-400" />
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Verified</p>
                <p className="text-2xl font-bold text-green-700">{statusCounts.verified}</p>
              </div>
              <FiCheckCircle className="text-3xl text-green-400" />
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">Rejected</p>
                <p className="text-2xl font-bold text-red-700">{statusCounts.rejected}</p>
              </div>
              <FiXCircle className="text-3xl text-red-400" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveFilter(tab.key);
                    setCurrentPage(1);
                  }}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeFilter === tab.key
                      ? `border-${tab.color}-500 text-${tab.color}-600`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeFilter === tab.key
                      ? `bg-${tab.color}-100 text-${tab.color}-800`
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Search & Refresh */}
          <div className="p-4 flex items-center justify-between">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={fetchOwners}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FiAlertCircle className="text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
            <button
              onClick={fetchOwners}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <FiRefreshCw className="animate-spin text-4xl text-indigo-600" />
          </div>
        )}

        {/* Owners List */}
        {!loading && owners.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FiUsers className="mx-auto text-5xl text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No {activeFilter.replace('_', ' ')} verifications found</p>
          </div>
        )}

        {!loading && owners.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documents
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {owners
                  .filter(owner => 
                    searchTerm === '' || 
                    owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    owner.email.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((owner) => (
                    <tr key={owner._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-medium">
                              {owner.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{owner.name}</div>
                            <div className="text-sm text-gray-500">{owner.email}</div>
                            {owner.phone && (
                              <div className="text-xs text-gray-400">{owner.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{owner.propertyName || 'Not specified'}</div>
                        <div className="text-sm text-gray-500">
                          {owner.propertyCount ? `${owner.propertyCount} properties` : 'Count not specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {owner.verificationSubmittedAt 
                            ? format(new Date(owner.verificationSubmittedAt), 'MMM dd, yyyy')
                            : format(new Date(owner.createdAt), 'MMM dd, yyyy')
                          }
                        </div>
                        <div className="text-xs text-gray-500">
                          {owner.verificationSubmittedAt 
                            ? format(new Date(owner.verificationSubmittedAt), 'hh:mm a')
                            : format(new Date(owner.createdAt), 'hh:mm a')
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(owner.ownerVerificationStatus)}
                        {owner.rejectionReason && (
                          <p className="text-xs text-red-500 mt-1 max-w-xs truncate" title={owner.rejectionReason}>
                            {owner.rejectionReason}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          {owner.verificationDocuments?.governmentId?.url && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600" title="Government ID">
                              <FiFileText className="mr-1" /> ID
                            </span>
                          )}
                          {owner.verificationDocuments?.propertyProof?.url && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600" title="Property Proof">
                              <FiImage className="mr-1" /> Prop
                            </span>
                          )}
                          {owner.verificationDocuments?.businessRegistration?.url && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600" title="Business Registration">
                              <FiFileText className="mr-1" /> Biz
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => fetchOwnerDetails(owner._id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <FiEye className="inline mr-1" /> View
                        </button>
                        {owner.ownerVerificationStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(owner._id)}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              <FiCheckCircle className="inline mr-1" /> Approve
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  <FiChevronLeft className="mr-1" /> Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Next <FiChevronRight className="ml-1" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Detail Modal */}
        {showModal && selectedOwner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Owner Verification Details</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedOwner(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiXCircle className="text-2xl" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Owner Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-500">Full Name</label>
                        <p className="text-gray-900 font-medium">{selectedOwner.name}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Email</label>
                        <p className="text-gray-900">{selectedOwner.email}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Phone</label>
                        <p className="text-gray-900">{selectedOwner.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Status</label>
                        <div className="mt-1">{getStatusBadge(selectedOwner.ownerVerificationStatus)}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-500">Property/Business Name</label>
                        <p className="text-gray-900">{selectedOwner.propertyName || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Number of Properties</label>
                        <p className="text-gray-900">{selectedOwner.propertyCount || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Business Address</label>
                        <p className="text-gray-900">{selectedOwner.businessAddress || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">GST Number</label>
                        <p className="text-gray-900">{selectedOwner.gstNumber || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Documents */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Government ID */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                        <FiFileText className="mr-2 text-indigo-500" />
                        Government ID
                      </h4>
                      {selectedOwner.verificationDocuments?.governmentId?.url ? (
                        <div>
                          <img
                            src={selectedOwner.verificationDocuments.governmentId.url}
                            alt="Government ID"
                            className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80"
                            onClick={() => setSelectedDocument(selectedOwner.verificationDocuments?.governmentId?.url || null)}
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Uploaded: {format(new Date(selectedOwner.verificationDocuments.governmentId.uploadedAt), 'MMM dd, yyyy')}
                          </p>
                          <a
                            href={selectedOwner.verificationDocuments.governmentId.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 text-sm mt-1 inline-block"
                          >
                            Open Full Size →
                          </a>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">Not uploaded</p>
                      )}
                    </div>

                    {/* Property Proof */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                        <FiImage className="mr-2 text-green-500" />
                        Property Proof
                      </h4>
                      {selectedOwner.verificationDocuments?.propertyProof?.url ? (
                        <div>
                          <img
                            src={selectedOwner.verificationDocuments.propertyProof.url}
                            alt="Property Proof"
                            className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80"
                            onClick={() => setSelectedDocument(selectedOwner.verificationDocuments?.propertyProof?.url || null)}
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Uploaded: {format(new Date(selectedOwner.verificationDocuments.propertyProof.uploadedAt), 'MMM dd, yyyy')}
                          </p>
                          <a
                            href={selectedOwner.verificationDocuments.propertyProof.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 text-sm mt-1 inline-block"
                          >
                            Open Full Size →
                          </a>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">Not uploaded</p>
                      )}
                    </div>

                    {/* Business Registration */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                        <FiFileText className="mr-2 text-orange-500" />
                        Business Registration
                      </h4>
                      {selectedOwner.verificationDocuments?.businessRegistration?.url ? (
                        <div>
                          <img
                            src={selectedOwner.verificationDocuments.businessRegistration.url}
                            alt="Business Registration"
                            className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80"
                            onClick={() => setSelectedDocument(selectedOwner.verificationDocuments?.businessRegistration?.url || null)}
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Uploaded: {format(new Date(selectedOwner.verificationDocuments.businessRegistration.uploadedAt), 'MMM dd, yyyy')}
                          </p>
                          <a
                            href={selectedOwner.verificationDocuments.businessRegistration.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 text-sm mt-1 inline-block"
                          >
                            Open Full Size →
                          </a>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">Not uploaded (Optional)</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rejection Reason (if rejected) */}
                {selectedOwner.rejectionReason && (
                  <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 mb-2">Rejection Reason</h4>
                    <p className="text-red-700">{selectedOwner.rejectionReason}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                  {selectedOwner.ownerVerificationStatus === 'pending' && (
                    <button
                      onClick={() => handleMarkUnderReview(selectedOwner._id)}
                      disabled={actionLoading}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <FiEye className="mr-2" />
                      Mark Under Review
                    </button>
                  )}

                  {['pending', 'under_review'].includes(selectedOwner.ownerVerificationStatus) && (
                    <>
                      <button
                        onClick={() => handleApprove(selectedOwner._id)}
                        disabled={actionLoading}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <FiCheckCircle className="mr-2" />
                        Approve Owner
                      </button>

                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={actionLoading}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        <FiXCircle className="mr-2" />
                        Reject Owner
                      </button>
                    </>
                  )}

                  {selectedOwner.ownerVerificationStatus === 'rejected' && (
                    <button
                      onClick={() => handleApprove(selectedOwner._id)}
                      disabled={actionLoading}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <FiCheckCircle className="mr-2" />
                      Re-Approve Owner
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedOwner(null);
                    }}
                    className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reject Reason Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <FiXCircle className="mr-2 text-red-500" />
                Reject Verification
              </h3>
              <p className="text-gray-600 mb-4">
                Please provide a reason for rejecting <strong>{selectedOwner?.name}</strong>'s verification:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason (e.g., 'Government ID is not clear', 'Property documents don't match', etc.)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 h-32"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 10 characters required</p>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading || rejectionReason.trim().length < 10}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full Size Document Viewer */}
        {selectedDocument && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedDocument(null)}
          >
            <div className="relative max-w-4xl w-full">
              <button
                onClick={() => setSelectedDocument(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300"
              >
                <FiXCircle className="text-3xl" />
              </button>
              <img
                src={selectedDocument}
                alt="Document"
                className="w-full max-h-[80vh] object-contain rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOwnerVerifications;