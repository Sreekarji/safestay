import React from 'react';
import { ImageGallery } from './ImageGallery';
import UpvoteButton from './UpvoteButton';
import { FiEdit2, FiTrash2, FiAlertTriangle, FiCheckCircle, FiClock, FiTool, FiCheck, FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';

interface Image {
  url: string;
  publicId?: string;
}

interface Resolution {
  description: string;
  actionTaken: string;
  images: Array<{ url: string; publicId: string }>;
  resolvedBy?: { name: string } | string;
  resolvedAt?: string;
}

interface Verification {
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  feedback?: string;
  isDisputed: boolean;
  disputeReason?: string;
}

interface Report {
  _id: string;
  accommodationName: string;
  accommodationId?: string;
  issueType: string;
  description: string;
  images?: Image[];
  createdAt: string;
  status?: string;
  upvotes?: number;
  upvotedBy?: string[];
  user?: string;
  resolution?: Resolution;
  verification?: Verification;
}

interface ReportCardProps {
  report: Report;
  onEdit: (report: Report) => void;
  onDelete: (id: string) => void;
  onVerify?: (id: string, accepted: boolean, feedbackOrReason: string) => void;
  currentUserId?: string;
  showAccommodationLink?: boolean;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, onEdit, onDelete, onVerify, currentUserId, showAccommodationLink = true }) => {
  const [showVerifyInput, setShowVerifyInput] = React.useState(false);
  const [isAccepting, setIsAccepting] = React.useState(true);
  const [feedback, setFeedback] = React.useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold inline-flex items-center gap-1">
            <FiClock className="text-xs" /> Under Review
          </span>
        );
      case 'approved':
        return (
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold inline-flex items-center gap-1">
            <FiCheck className="text-xs" /> Published
          </span>
        );
      case 'resolved':
        return (
          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold inline-flex items-center gap-1">
            <FiTool className="text-xs" /> Owner Responded
          </span>
        );
      case 'verified':
        return (
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold inline-flex items-center gap-1">
            <FiCheckCircle className="text-xs" /> Verified
          </span>
        );
      case 'disputed':
        return (
          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold inline-flex items-center gap-1">
            <FiAlertTriangle className="text-xs" /> Disputed
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
            {status}
          </span>
        );
    }
  };

  const getIssueBadge = (issueType: string) => {
    const colors: { [key: string]: string } = {
      'Security': 'bg-red-50 text-red-600 border-red-100',
      'Infrastructure': 'bg-orange-50 text-orange-600 border-orange-100',
      'Food Safety': 'bg-orange-100 text-orange-700 border-orange-200',
      'Water Quality': 'bg-blue-50 text-blue-600 border-blue-100',
      'Hygiene': 'bg-green-50 text-green-600 border-green-100'
    };
    const style = colors[issueType] || 'bg-gray-50 text-gray-600 border-gray-100';
    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${style}`}>
        {issueType}
      </span>
    );
  };

  const handleVerifySubmit = () => {
    if (!isAccepting && !feedback) {
      alert('Please provide a reason for dispute');
      return;
    }
    if (onVerify) {
      onVerify(report._id, isAccepting, feedback);
      setShowVerifyInput(false);
      setFeedback('');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 p-6 lg:p-8 group">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div className="flex-grow">
            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge(report.status || 'pending')}
              {getIssueBadge(report.issueType)}
            </div>
            {showAccommodationLink && report.accommodationId ? (
              <Link to={`/accommodations/${report.accommodationId}`} className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors inline-flex items-center gap-2">
                {report.accommodationName} <FiArrowRight className="text-xs opacity-0 group-hover:opacity-100 transition-all" />
              </Link>
            ) : (
              <h3 className="text-lg font-bold text-gray-900">{report.accommodationName}</h3>
            )}
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <FiClock className="text-blue-400" />
              {report.createdAt ? new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
            </span>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-grow mb-6">
          <p className="text-gray-600 text-sm leading-relaxed mb-6">{report.description}</p>
          {report.images && report.images.length > 0 && (
            <div className="mb-6">
              <ImageGallery images={report.images} />
            </div>
          )}
        </div>

        {/* Resolution Section */}
        {report.status === 'resolved' && report.resolution && (
          <div className="bg-purple-50 rounded-2xl p-6 mb-6 border border-purple-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <FiTool className="h-4 w-4" />
              </div>
              <h4 className="text-[10px] font-black text-purple-800 uppercase tracking-widest">Property Manager Response</h4>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-xs font-black text-purple-900 uppercase tracking-widest mb-1">Action Taken</p>
                <p className="text-sm font-bold text-purple-900">{report.resolution.actionTaken}</p>
              </div>
              <p className="text-sm text-purple-700 italic bg-white/50 p-4 rounded-xl border border-white">"{report.resolution.description}"</p>
              {report.resolution.images && report.resolution.images.length > 0 && (
                <ImageGallery images={report.resolution.images} />
              )}
            </div>
            
            {!showVerifyInput ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button 
                  onClick={() => { setIsAccepting(true); setShowVerifyInput(true); }}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-green-500/25 flex items-center justify-center gap-2"
                >
                  <FiCheckCircle /> Verify Fix
                </button>
                <button 
                  onClick={() => { setIsAccepting(false); setShowVerifyInput(true); }}
                  className="bg-white hover:bg-red-50 text-red-600 px-6 py-3 rounded-xl font-semibold border border-red-200 transition-all flex items-center justify-center gap-2"
                >
                  <FiAlertTriangle /> Dispute
                </button>
              </div>
            ) : (
              <div className="mt-4 bg-white p-6 rounded-2xl border border-purple-100 shadow-sm animate-in slide-in-from-top-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 ml-1">
                  {isAccepting ? 'Verification Feedback (Optional)' : 'Reason for Dispute (Required)'}
                </label>
                <textarea 
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm text-gray-700 placeholder-gray-400 mb-4"
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={isAccepting ? "Confirm the issue is resolved..." : "Explain why the issue still persists..."}
                />
                <div className="flex gap-3">
                  <button 
                    onClick={handleVerifySubmit}
                    className={`flex-grow py-3 rounded-xl font-bold text-white transition-all shadow-lg ${isAccepting ? 'bg-green-600 shadow-green-500/25' : 'bg-red-600 shadow-red-500/25'}`}
                  >
                    Submit {isAccepting ? 'Verification' : 'Dispute'}
                  </button>
                  <button 
                    onClick={() => setShowVerifyInput(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status Messages */}
        {report.status === 'verified' && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <FiCheckCircle className="text-green-600 h-5 w-5 mt-0.5" />
            <div>
              <p className="text-green-800 font-bold text-sm">Resolution Verified</p>
              {report.verification?.feedback && (
                <p className="text-xs text-green-700/80 mt-1 font-medium italic">"{report.verification.feedback}"</p>
              )}
            </div>
          </div>
        )}

        {report.status === 'disputed' && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <FiAlertTriangle className="text-red-600 h-5 w-5 mt-0.5" />
            <div>
              <p className="text-red-800 font-bold text-sm">Dispute Under Review</p>
              {report.verification?.disputeReason && (
                <p className="text-xs text-red-700/80 mt-1 font-medium italic">"{report.verification.disputeReason}"</p>
              )}
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-50">
          <div className="flex items-center gap-4">
            {currentUserId && (
              <UpvoteButton
                reportId={report._id}
                initialUpvotes={report.upvotes || 0}
                initialHasUpvoted={(report.upvotedBy || []).includes(currentUserId)}
                isOwnReport={report.user === currentUserId}
              />
            )}
          </div>
          
          <div className="flex gap-2">
            {(report.status === 'pending' || report.status === 'approved') && (
              <>
                <button 
                  className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  onClick={() => onEdit(report)}
                  title="Edit Report"
                >
                  <FiEdit2 className="h-5 w-5" />
                </button>
                <button 
                  className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  onClick={() => onDelete(report._id)}
                  title="Delete Report"
                >
                  <FiTrash2 className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ReportCard);
