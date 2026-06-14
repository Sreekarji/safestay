const ownerMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'owner') {
    return res.status(403).json({
      success: false,
      message: 'Accommodation owner access required'
    });
  }

  // ✅ Check verification status from JWT payload (no DB query needed!)
  const status = req.user.ownerVerificationStatus;

  if (status === 'pending') {
    return res.status(403).json({
      success: false,
      message: 'Your account is pending verification. Please wait for admin approval.',
      verificationStatus: 'pending',
      requiresVerification: true
    });
  }

  if (status === 'under_review') {
    return res.status(403).json({
      success: false,
      message: 'Your documents are currently under review.',
      verificationStatus: 'under_review',
      requiresVerification: true
    });
  }

  if (status === 'rejected') {
    return res.status(403).json({
      success: false,
      message: 'Your verification was rejected. Please reapply with correct documents.',
      verificationStatus: 'rejected',
      canReapply: true
    });
  }

  if (status !== 'verified') {
    return res.status(403).json({
      success: false,
      message: 'Invalid verification status. Please contact support.'
    });
  }

  // ✅ Owner is verified
  next();
};

module.exports = ownerMiddleware;