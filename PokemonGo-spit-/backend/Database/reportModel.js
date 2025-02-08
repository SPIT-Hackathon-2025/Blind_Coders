const { reportsRef, usersRef, admin } = require("./firebase");

// Function to create a report
const createReport = async (email, issueType, location, imageUrl) => {
  try {
    const reportId = reportsRef.doc().id;
    const newReport = {
      reportId,
      email,
      issueType,
      location,
      imageUrl,
      timestamp: new Date().toISOString(),
      status: "pending",
      verificationCount: 0,
      flaggedCount: 0,
    };

    await reportsRef.doc(reportId).set(newReport);
    return { success: true, message: "Report submitted successfully", reportId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Function to verify or flag a report
const verifyReport = async (reportId, isFlagged = false) => {
  try {
    const reportRef = reportsRef.doc(reportId);
    const report = await reportRef.get();

    if (!report.exists) return { success: false, error: "Report not found" };

    const data = report.data();
    let updateFields = isFlagged
      ? { flaggedCount: admin.firestore.FieldValue.increment(1) }
      : { verificationCount: admin.firestore.FieldValue.increment(1) };

    await reportRef.update(updateFields);

    // If 3 verifications, mark as "verified" & increase credibility
    if (!isFlagged && data.verificationCount + 1 >= 3) {
      await reportRef.update({ status: "verified" });
      await usersRef.doc(data.email).update({
        credibilityScore: admin.firestore.FieldValue.increment(10),
      });
    }

    // If 2 flags, mark as "flagged"
    if (isFlagged && data.flaggedCount + 1 >= 2) {
      await reportRef.update({ status: "flagged" });
    }

    return { success: true, message: `Report ${isFlagged ? "flagged" : "verified"} successfully` };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { createReport, verifyReport };
