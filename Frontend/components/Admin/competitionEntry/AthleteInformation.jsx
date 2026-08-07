import "./AthleteInformation.css";

const AthleteInformation = ({ athlete }) => {

    if (!athlete) return null;

    const { registrationNo, personalInfo, participations } = athlete;

    return (

        <div className="entry-card">

            <div className="entry-card-header">

                <h2 className="entry-card-title">
                    Athlete Information
                </h2>

            </div>

            <div className="entry-card-body">

                <div className="form-grid">

                    <div className="form-group">

                        <label>Registration No</label>

                        <input
                            type="text"
                            value={registrationNo || ""}
                            readOnly
                        />

                    </div>

                    <div className="form-group">

                        <label>Full Name</label>

                        <input
                            type="text"
                            value={personalInfo?.fullName || ""}
                            readOnly
                        />

                    </div>

                    <div className="form-group">

                        <label>Gender</label>

                        <input
                            type="text"
                            value={personalInfo?.gender || ""}
                            readOnly
                        />

                    </div>

                    <div className="form-group">

                        <label>Date of Birth</label>

                        <input
                            type="text"
                            value={
                                personalInfo?.dob
                                    ? new Date(personalInfo.dob).toLocaleDateString()
                                    : ""
                            }
                            readOnly
                        />

                    </div>

                    <div className="form-group">

                        <label>Phone</label>

                        <input
                            type="text"
                            value={personalInfo?.phone || ""}
                            readOnly
                        />

                    </div>

                    <div className="form-group">

                        <label>Email</label>

                        <input
                            type="text"
                            value={personalInfo?.email || ""}
                            readOnly
                        />

                    </div>

                    <div className="form-group">

                        <label>Category</label>

                        <input
                            type="text"
                            value={participations?.[0]?.category || ""}
                            readOnly
                        />

                    </div>

                    <div className="form-group form-group-full">

                        <label>Address</label>

                        <textarea
                            rows="3"
                            value={personalInfo?.address || ""}
                            readOnly
                        />

                    </div>

                </div>

            </div>

        </div>

    );

};

export default AthleteInformation;