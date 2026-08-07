import React, { useState } from "react";
import calculateEligibility from "../../services/eligibilityService.js";
// import getWeightCategories from "../services/WeightCategoryService.js";
import registerAthlete from "../../services/registrationService.js";
import { useNavigate } from "react-router-dom";
import "../../components/Athlete/Registration/Registration.css"
import {
  FaCloudUploadAlt,
  FaCheckCircle,
  FaUser,
  FaTrophy,
  FaFileAlt 
} from "react-icons/fa";

const RegistrationForm = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    personalInfo: {
      fullName: "",
      gender: "",
      dob: "",
      age: "",
      phone: "",
      email: "",
      address: "",
    },

    competitionInfo: {
      club: "",
      coach: "",
      coachPhone: "",
    },

    participations: [],

    documents: {
  passportPhoto: null,
  aadharCard: null,
  birthCertificate: null,
  iwlfCard: null
},
  });

  const [eligibleCategories, setEligibleCategories] = useState([]);
  // const [weightCategories, setWeightCategories] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const personalFields = [
    {
      label: "Full Name",
      name: "fullName",
      type: "text",
      placeholder: "Enter Full Name",
      required: true,
    },
    {
      label: "Gender",
      name: "gender",
      type: "select",
      required: true,
      options: ["Male", "Female"],
    },
    {
      label: "Date of Birth",
      name: "dob",
      type: "date",
      required: true,
    },
    {
      label: "Phone",
      name: "phone",
      type: "text",
      placeholder: "Enter Phone Number",
      required: true,
    },
    {
      label: "Email",
      name: "email",
      type: "email",
      placeholder: "Enter Email Address",
      required: true,
    },
    {
      label: "Address",
      name: "address",
      type: "text",
      placeholder: "Enter Address",
      required: true,
    },
    {
      label: "Calculated Age",
      name: "age",
      type: "number",
      readOnly: true,
    },
  ];
  const documentFields = [
    {
      label: "Birth Certificate",
      name: "birthCertificate",
      type: "file",
      required: true,
    },
   {
  label: "Aadhar Card",
  name: "aadharCard",
  type: "file",
  required: true,
},
    {
      label: "IWLF Card (If Available)",
      name: "iwlfCard",
      type: "file",
      required: false,
    },
    {
      label: "Passport size photo",
      name: "passportPhoto",
      type: "file",
      required: true,
    },

  ]
  const competitionFields = [
  {
    label: "Club Name",
    name: "club",
    type: "text",
    placeholder: "Enter Club Name",
    required: false,
  },
  {
    label: "Coach Name",
    name: "coach",
    type: "text",
    placeholder: "Enter Coach Name",
    required: false,
  },
  {
    label: "Coach Phone Number",
    name: "coachPhone",
    type: "tel",
    placeholder: "Enter Coach Phone Number",
    required: false,
  },
];
  const handlePersonalInfoChange = async (e) => {
    const { name, value } = e.target;

    try {
      // Gender changed
      if (name === "gender") {
        setFormData((prev) => ({
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            gender: value,
          },
          participations: [],
        }));

        return;
      }

      // DOB changed
      if (name === "dob") {
        const response = await calculateEligibility(value);

        const { age, eligibleCategories } = response.data;

        setFormData((prev) => ({
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            dob: value,
            age,
          },
          participations: [],
        }));

        setEligibleCategories(eligibleCategories);

        return;
      }

      // Other fields
      setFormData((prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          [name]: value,
        },
      }));
    }catch (error) {
    console.error("Registration Error:", error);

    if (error.response) {
        alert(error.response.data.message || JSON.stringify(error.response.data));
    } else {
        alert(error.message);
    }
}
  };

  const handleParticipationChange = (e) => {
    const { value, checked } = e.target;

    if (checked) {
      setFormData((prev) => ({
        ...prev,
        participations: [
          ...prev.participations,
          {
            category: value,
            weightCategory: "",
          },
        ],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        participations: prev.participations.filter(
          (item) => item.category !== value
        ),
      }));
    }
  };

  /* const handleWeightCategoryChange = (e) => {
    const { name, value } = e.target
    console.log(formData.participations);
    setFormData((prev) => ({
      ...prev,
      participations: prev.participations.map((participation) => participation.category === name ? { ...participation, weightCategory: value } : participation)
    }))
  } */
 const handleDocumentChange = (e) => {
    const { name, files } = e.target;

    const file = files[0];

    if (!file) return;

    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    const document = documentFields.find((d) => d.name === name);

    if (file.size > MAX_FILE_SIZE) {
        alert(`${document.label} must be smaller than 10 MB.`);
        e.target.value = "";
        return;
    }

    setFormData((prev) => ({
        ...prev,
        documents: {
            ...prev.documents,
            [name]: file,
        },
    }));
};
  const handleCompetitionInfoChange = (e) => {
  const { name, value } = e.target;

  setFormData((prev) => ({
    ...prev,
    competitionInfo: {
      ...prev.competitionInfo,
      [name]: value,
    },
  }));
};

  const handleSubmit = async (e) => {
    e.preventDefault();
     if (formData.participations.length === 0) {
    alert("Please select at least one age category.");
    return;
  }
    try {
      setIsSubmitting(true);
for (const document of documentFields) {
  if (
    document.required &&
    !formData.documents[document.name]
  ) {
    alert(`Please upload ${document.label}.`);
    return;
  }
}
      const formDataToSend = new FormData();

      personalFields.forEach((field) => {
        formDataToSend.append(
          field.name,
          formData.personalInfo[field.name]
        );
      });

      formDataToSend.append(
        "club",
        formData.competitionInfo.club
      );

      formDataToSend.append(
        "coach",
        formData.competitionInfo.coach
      );

      formDataToSend.append(
        "coachPhone",
        formData.competitionInfo.coachPhone
      );

      formData.participations.forEach((item, index) => {
        formDataToSend.append(
          `participations[${index}][category]`,
          item.category
        );
      });

      documentFields.forEach((field) => {
        if (formData.documents[field.name]) {
          formDataToSend.append(
            field.name,
            formData.documents[field.name]
          );
        }
      });
      const response = await registerAthlete(formDataToSend);
      navigate("/registration-success", {
        state: response.data,
      });
    } catch (error) {
    console.error("Registration Error:", error);

    if (error.message) {
        alert(error.message);
    }
    else if (error.errors) {
        alert(Object.values(error.errors).join("\n"));
    }
    else {
        alert(JSON.stringify(error, null, 2));
    }
}
finally {
    setIsSubmitting(false);
}
  };
  return (
    <div className= "registration-page">
      {isSubmitting && (
    <div className="loading-overlay">
        <div className="loading-box">
            <span className="spinner"></span>
            <p>Submitting Registration...</p>
            <small>Please don't refresh this page.</small>
        </div>
    </div>
)}
      <div className="registration-container">
      <div className="registration-header">
    <h1>Athlete Registration</h1>

    <p>
        Complete the form below to register for the
        championship.
    </p>
</div>
      <form onSubmit={handleSubmit}>
        
       <fieldset disabled={isSubmitting}>
         <div className="form-card">
          <h2>
    <FaUser />
    Personal Information
</h2>
          <div className="form-grid">
          {personalFields.map((field) => (
          <div key={field.name}className ={
          field.name === "address"
            ? "form-group full-width"
            : "form-group"
        }>
            <label>{field.label}</label>

            {field.type === "select" ? (
              <select
                name={field.name}
                value={formData.personalInfo[field.name]}
                onChange={handlePersonalInfoChange}
                required={field.required}
              >
                <option value="">Select Gender</option>

                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                name={field.name}
                placeholder={field.placeholder}
                required={field.required}
                readOnly={field.readOnly}
                value={formData.personalInfo[field.name]}
                onChange={handlePersonalInfoChange}
              />  
            )}
          </div>
        ))}
        </div>
        </div>
        <div className="form-card">
  <h2>
    <FaUser />
    Club & Coach Information
  </h2>

  <div className="form-grid">
    {competitionFields.map((field) => (
      <div key={field.name} className="form-group">
        <label>{field.label}</label>

        <input
          type={field.type}
          name={field.name}
          placeholder={field.placeholder}
          value={formData.competitionInfo[field.name]}
          onChange={handleCompetitionInfoChange}
          required={field.required}
        />
      </div>
    ))}
  </div>
</div>
        <div className="form-card">
  <h2>
    <FaTrophy />
    Competition Details
</h2>
<p>Select Date of Birth and Gender
to view eligible age categories.</p>

  <div className="category-list">
    {eligibleCategories.map((category) => (
      <label key={category} className="category-item">

        <input
          type="checkbox"
          value={category}
          checked={formData.participations.some(
            (participation) =>
              participation.category === category
          )}
          onChange={handleParticipationChange}
        />

        <span>{category}</span>

      </label>
    ))}
  </div>

  <div className="registration-summary">
    <h3>Registration Summary</h3>

    <p>
      <span>Selected Categories</span>
      <strong>{formData.participations.length}</strong>
    </p>

    <p>
      <span>Total Registration Fee</span>
      <strong>₹{formData.participations.length * 100}</strong>
    </p>
  </div>
</div>
       <div className="form-card">
 <h2>
    <FaFileAlt />
    Documents
</h2>

  <div className="document-grid">
    {documentFields.map((document) => (
      <div className="upload-card" key={document.name}>

        <label htmlFor={document.name} className="upload-label">

          <div className="upload-icon"> <FaCloudUploadAlt /></div>

          <h4>{document.label}</h4>

          <p>Click to upload</p>

          <small>JPG • PNG • PDF</small>

          {formData.documents[document.name] && (
            <div className="selected-file">
             <div className="selected-file">
    <FaCheckCircle />
    <span>{formData.documents[document.name].name}</span>
</div>
            </div>
          )}

        </label>

        <input
          id={document.name}
          type="file"
          name={document.name}
          required={document.required}
          accept="image/*,.pdf"
          onChange={handleDocumentChange}
          className="file-input"
        />

      </div>
    ))}
  </div>
</div>
        
        {/* {
          formData.participations.map((participation) => (
            <div key={participation.category}>
              <label>{participation.category}</label>
              <select
                name={participation.category}
                value={participation.weightCategory}
                onChange={handleWeightCategoryChange}
                required
              >
                <option value="">Select Weight Category</option>

                {weightCategories[participation.category]?.map((weight) => (
                  <option
                    key={weight}
                    value={weight}
                  >
                    {weight}
                  </option>
                ))}
              </select>
            </div>
          ))
        } */}
       
        <button
  type="submit"
  className="submit-btn"
  disabled={isSubmitting}
>
  {isSubmitting ? (
    <>
      <span className="spinner"></span>
      Registering Athlete...
    </>
  ) : (
    "Register Athlete"
  )}
</button>
       </fieldset>
      </form>
      </div>
    </div>
  );


};

export default RegistrationForm;