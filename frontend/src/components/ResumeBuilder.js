import { useState } from "react";
import axios from "axios";

function ResumeBuilder() {

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    linkedin: "",
    github: "",

    objective: "",

    education: [
      {
        degree: "",
        branch: "",
        college: "",
        cgpa: "",
        graduationYear: ""
      }
    ],

    skills: [],

    projects: [
        {
            title: "",
            description: "",
            technologies: ""
        }
    ],

    internships: [
      {
        company: "",
        role: "",
        duration: "",
        description: "",
        projects: ""
      }
    ],

    certifications: [
      ""
    ],

    achievements: [
      ""
    ]

  });
  const [customSkill, setCustomSkill] = useState("");

  const skillOptions = [
    "Python",
    "Java",
    "C++",
    "JavaScript",
    "React",
    "Node.js",
    "SQL",
    "MongoDB",
    "Machine Learning",
    "Deep Learning",
    "NLP",
    "TensorFlow",
    "Git",
    "Docker",
    "Salesforce"
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSkillChange = (skill) => {

    if (formData.skills.includes(skill)) {

      setFormData({
        ...formData,
        skills: formData.skills.filter(
          (s) => s !== skill
        )
      });

    } else {

      setFormData({
        ...formData,
        skills: [...formData.skills, skill]
      });

    }
  };

  const addCustomSkill = () => {

    const skill = customSkill.trim();

    if (!skill) return;

    // Prevent duplicate skills
    const alreadyExists = formData.skills.some(
      (existingSkill) =>
        existingSkill.toLowerCase() === skill.toLowerCase()
    );

    if (!alreadyExists) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skill]
      });
    }

    setCustomSkill("");
  };

  const handleCustomSkillKeyDown = (e) => {

    if (e.key === "Enter") {
      e.preventDefault();
      addCustomSkill();
    }

  };

  const addProject = () => {
      setFormData({
          ...formData,
          projects: [
              ...formData.projects,
              {
                  title: "",
                  description: "",
                  technologies: ""
              }
          ]
      });
  };

  const updateProject = (index, field, value) => {
      const updatedProjects = [...formData.projects];

      updatedProjects[index][field] = value;

      setFormData({
          ...formData,
          projects: updatedProjects
      });
  };

  const removeProject = (index) => {

      const updatedProjects = formData.projects.filter(
          (_, i) => i !== index
      );

      setFormData({
          ...formData,
          projects: updatedProjects
      });
  };

  const addInternship = () => {
    setFormData({
      ...formData,
      internships: [
        ...formData.internships,
        {
          company: "",
          role: "",
          duration: "",
          description: "",
          projects: ""
        }
      ]
    });
  };

  const updateInternship = (index, field, value) => {
    const updatedInternships = [...formData.internships];

    updatedInternships[index][field] = value;

    setFormData({
      ...formData,
      internships: updatedInternships
    });
  };

  const removeInternship = (index) => {
    const updatedInternships = formData.internships.filter(
      (_, i) => i !== index
    );

    setFormData({
      ...formData,
      internships: updatedInternships
    });
  };

  const addCertification = () => {
    setFormData({
      ...formData,
      certifications: [
        ...formData.certifications,
        ""
      ]
    });
  };

  const updateCertification = (index, value) => {
    const updatedCertifications = [
      ...formData.certifications
    ];

    updatedCertifications[index] = value;

    setFormData({
      ...formData,
      certifications: updatedCertifications
    });
  };

  const removeCertification = (index) => {
    const updatedCertifications =
      formData.certifications.filter(
        (_, i) => i !== index
      );

    setFormData({
      ...formData,
      certifications: updatedCertifications
    });
  };

  const addAchievement = () => {
    setFormData({
      ...formData,
      achievements: [
        ...formData.achievements,
        ""
      ]
    });
  };

  const updateAchievement = (index, value) => {
    const updatedAchievements = [
      ...formData.achievements
    ];

    updatedAchievements[index] = value;

    setFormData({
      ...formData,
      achievements: updatedAchievements
    });
  };

  const removeAchievement = (index) => {
    const updatedAchievements =
      formData.achievements.filter(
        (_, i) => i !== index
      );

    setFormData({
      ...formData,
      achievements: updatedAchievements
    });
  };

  const addEducation = () => {
    setFormData({
      ...formData,
      education: [
        ...formData.education,
        {
          degree: "",
          branch: "",
          college: "",
          cgpa: "",
          graduationYear: ""
        }
      ]
    });
  };

  const updateEducation = (index, field, value) => {
    const updatedEducation = [...formData.education];

    updatedEducation[index][field] = value;

    setFormData({
      ...formData,
      education: updatedEducation
    });
  };

  const removeEducation = (index) => {
    const updatedEducation = formData.education.filter(
      (_, i) => i !== index
    );

    setFormData({
      ...formData,
      education: updatedEducation
    });
  };

  const generateResume = async () => {
    try {

      const response = await axios.post(
        "http://127.0.0.1:8000/generate-resume",
        formData,
        {
          responseType: "blob"
        }
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data])
      );

      const link = document.createElement("a");
      link.href = url;
      const candidateName =
      formData.name.trim() || "Resume";

      link.download =
          `${candidateName.replace(/\s+/g, "_")}.pdf`;
      
      document.body.appendChild(link);

      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6 bg-gray-100 text-gray-900 dark:bg-slate-950 dark:text-white">

      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        AI Resume Builder
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">

        {/* ================= PERSONAL INFORMATION ================= */}

        <div className="border border-gray-200 bg-white p-4 rounded-lg dark:bg-slate-900 dark:border-slate-700">

          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Personal Information
          </h3>

          <div className="space-y-3">

            <input
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-300 bg-blue-50 text-gray-900 p-3 rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-gray-500 dark:placeholder-gray-400"
            />

            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-300 bg-blue-50 text-gray-900 p-3 rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-gray-500 dark:placeholder-gray-400"
            />

            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 bg-blue-50 text-gray-900 p-3 rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-gray-500 dark:placeholder-gray-400"
            />

            <input
              type="text"
              name="linkedin"
              placeholder="LinkedIn URL"
              value={formData.linkedin}
              onChange={handleChange}
              className="w-full border border-gray-300 bg-blue-50 text-gray-900 p-3 rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-gray-500 dark:placeholder-gray-400"
            />

            <input
              type="text"
              name="github"
              placeholder="GitHub URL"
              value={formData.github}
              onChange={handleChange}
              className="w-full border border-gray-300 bg-blue-50 text-gray-900 p-3 rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-gray-500 dark:placeholder-gray-400"
            />

          </div>

        </div>

        {/* ================= CAREER OBJECTIVE ================= */}

        <div className="border border-gray-200 bg-white p-4 rounded-lg dark:bg-slate-900 dark:border-slate-700">

          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Career Objective
          </h3>

          <textarea
            name="objective"
            placeholder="Write a short professional career objective..."
            value={formData.objective}
            onChange={handleChange}
            className="w-full border border-gray-300 bg-blue-50 text-gray-900 p-3 rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-gray-500 dark:placeholder-gray-400"
            rows="4"
          />

        </div>

        {/* ================= EDUCATION ================= */}

        <div className="border border-gray-200 bg-white p-4 rounded-lg dark:bg-slate-900 dark:border-slate-700">

          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Education
          </h3>

          {formData.education.map((edu, index) => (

            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50 dark:bg-slate-800 dark:border-slate-600"
            >

              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Education {index + 1}
              </h4>

              {/* Degree */}
              <input
                type="text"
                placeholder="Degree (e.g. B.Tech, BCA, M.Tech)"
                value={edu.degree}
                onChange={(e) =>
                  updateEducation(
                    index,
                    "degree",
                    e.target.value
                  )
                }
                className="border border-gray-300 bg-blue-50 text-gray-900 p-2 rounded w-full mb-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              {/* Branch */}
              <input
                type="text"
                placeholder="Branch / Specialization (e.g. Computer Science and Engineering)"
                value={edu.branch}
                onChange={(e) =>
                  updateEducation(
                    index,
                    "branch",
                    e.target.value
                  )
                }
                className="border border-gray-300 bg-blue-50 text-gray-900 p-2 rounded w-full mb-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              {/* College */}
              <input
                type="text"
                placeholder="College / University Name"
                value={edu.college}
                onChange={(e) =>
                  updateEducation(
                    index,
                    "college",
                    e.target.value
                  )
                }
                className="border border-gray-300 bg-blue-50 text-gray-900 p-2 rounded w-full mb-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              {/* CGPA */}
              <input
                type="text"
                placeholder="CGPA / Percentage"
                value={edu.cgpa}
                onChange={(e) =>
                  updateEducation(
                    index,
                    "cgpa",
                    e.target.value
                  )
                }
                className="border border-gray-300 bg-blue-50 text-gray-900 p-2 rounded w-full mb-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              {/* Graduation Year */}
              <input
                type="text"
                placeholder="Graduation Year (e.g. 2027)"
                value={edu.graduationYear}
                onChange={(e) =>
                  updateEducation(
                    index,
                    "graduationYear",
                    e.target.value
                  )
                }
                className="border border-gray-300 bg-blue-50 text-gray-900 p-2 rounded w-full mb-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              {formData.education.length > 1 && (

                <button
                  type="button"
                  onClick={() => removeEducation(index)}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Remove Education
                </button>

              )}

            </div>

          ))}

          <button
            type="button"
            onClick={addEducation}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            + Add Education
          </button>

        </div>

        {/* ================= SKILLS ================= */}

        <div className="border border-gray-200 bg-white p-4 rounded-lg dark:bg-slate-900 dark:border-slate-700">

          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Skills
          </h3>


          {/* PREDEFINED SKILLS */}

          <div className="grid grid-cols-4 gap-3 mb-5">

            {skillOptions.map((skill) => (

              <label
                key={skill}
                className="flex items-center gap-2 text-gray-900 dark:text-white"
              >

                <input
                  type="checkbox"
                  checked={formData.skills.includes(skill)}
                  onChange={() => handleSkillChange(skill)}
                />

                {skill}

              </label>

            ))}

          </div>


          {/* DIVIDER */}

          <div className="border-t border-gray-200 dark:border-slate-700 pt-4">


            <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
              Add Your Own Skills
            </h4>


            {/* CUSTOM SKILL INPUT */}

            <div className="flex gap-3">

              <input
                type="text"
                placeholder="Enter a skill (e.g. AWS, Django, Kubernetes)"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={handleCustomSkillKeyDown}
                className="flex-1 border border-gray-300 bg-blue-50 text-gray-900 p-2 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-gray-400"
              />

              <button
                type="button"
                onClick={addCustomSkill}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded"
              >
                + Add
              </button>

            </div>


            {/* ADDED CUSTOM SKILLS */}

            {formData.skills.filter(
              (skill) => !skillOptions.includes(skill)
            ).length > 0 && (

              <div className="mt-4">

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Your Added Skills
                </p>


                <div className="flex flex-wrap gap-2">

                  {formData.skills
                    .filter(
                      (skill) => !skillOptions.includes(skill)
                    )
                    .map((skill) => (

                      <div
                        key={skill}
                        className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full dark:bg-blue-900 dark:text-blue-200"
                      >

                        <span>
                          {skill}
                        </span>


                        <button
                          type="button"
                          onClick={() => handleSkillChange(skill)}
                          className="font-bold hover:text-red-500"
                        >
                          ×
                        </button>

                      </div>

                    ))}

                </div>

              </div>

            )}

          </div>

        </div>

        <div className="border border-gray-200 bg-white p-4 rounded-lg dark:bg-slate-900 dark:border-slate-700">

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Projects
        </h3>

        {formData.projects.map((project, index) => (

            <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50 dark:bg-slate-800 dark:border-slate-600"
            >

                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Project {index + 1}
                </h4>

                <input
                    type="text"
                    placeholder="Project Title"
                    value={project.title}
                    onChange={(e) =>
                        updateProject(
                            index,
                            "title",
                            e.target.value
                        )
                    }
                    className="border border-gray-300 bg-blue-50 text-gray-900 p-2 rounded w-full mb-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-gray-500 dark:placeholder-gray-400"
                />

                <textarea
                    placeholder="Project Description"
                    value={project.description}
                    onChange={(e) =>
                        updateProject(
                            index,
                            "description",
                            e.target.value
                        )
                    }
                    className="border border-gray-300 bg-blue-50 text-gray-900 p-2 rounded w-full mb-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-gray-500 dark:placeholder-gray-400"
                    rows="4"
                />

                <input
                    type="text"
                    placeholder="Technologies Used"
                    value={project.technologies}
                    onChange={(e) =>
                        updateProject(
                            index,
                            "technologies",
                            e.target.value
                        )
                    }
                    className="border border-gray-300 bg-blue-50 text-gray-900 p-2 rounded w-full mb-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-gray-500 dark:placeholder-gray-400"
                />

                {formData.projects.length > 1 && (
                    <button
                        type="button"
                        onClick={() => removeProject(index)}
                        className="bg-red-500 text-white px-4 py-2 rounded"
                    >
                        Remove Project
                    </button>
                )}

            </div>

        ))}

        <button
            type="button"
            onClick={addProject}
            className="bg-green-500 text-white px-4 py-2 rounded"
        >
            + Add Project
        </button>

    </div>

        {/* ================= INTERNSHIPS ================= */}

        <div className="border border-gray-200 bg-white p-4 rounded-lg dark:bg-slate-900 dark:border-slate-700">

          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Internships
          </h3>

          {formData.internships.map((internship, index) => (

            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50 dark:bg-slate-800 dark:border-slate-600"
            >

              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Internship {index + 1}
              </h4>

              {/* Company Name */}

              <input
                type="text"
                placeholder="Company Name"
                value={internship.company}
                onChange={(e) =>
                  updateInternship(
                    index,
                    "company",
                    e.target.value
                  )
                }
                className="border border-gray-300 bg-blue-50 text-gray-900 p-2 rounded w-full mb-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-gray-500 dark:placeholder-gray-400"
              />

              {/* Role */}

              <input
                type="text"
                placeholder="Role / Position"
                value={internship.role}
                onChange={(e) =>
                  updateInternship(
                    index,
                    "role",
                    e.target.value
                  )
                }
                className="border border-gray-300 bg-blue-50 text-gray-900 p-2 rounded w-full mb-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-gray-500 dark:placeholder-gray-400"
              />

              {/* Duration */}

              <input
                type="text"
                placeholder="Duration (e.g. Jun 2025 - Jul 2025)"
                value={internship.duration}
                onChange={(e) =>
                  updateInternship(
                    index,
                    "duration",
                    e.target.value
                  )
                }
                className="border border-gray-300 bg-blue-50 text-gray-900 p-2 rounded w-full mb-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-gray-500 dark:placeholder-gray-400"
              />

              {/* Description */}

              <textarea
                placeholder="Internship Description / Responsibilities"
                value={internship.description}
                onChange={(e) =>
                  updateInternship(
                    index,
                    "description",
                    e.target.value
                  )
                }
                className="border border-gray-300 bg-blue-50 text-gray-900 p-2 rounded w-full mb-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-gray-500 dark:placeholder-gray-400"
                rows="4"
              />

              {/* Projects completed during internship */}

              <textarea
                placeholder="Projects completed during internship"
                value={internship.projects}
                onChange={(e) =>
                  updateInternship(
                    index,
                    "projects",
                    e.target.value
                  )
                }
                className="border border-gray-300 bg-blue-50 text-gray-900 p-2 rounded w-full mb-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-gray-500 dark:placeholder-gray-400"
                rows="3"
              />

              {/* Remove */}

              {formData.internships.length > 1 && (

                <button
                  type="button"
                  onClick={() => removeInternship(index)}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Remove Internship
                </button>

              )}

            </div>

          ))}

          {/* Add Internship */}

          <button
            type="button"
            onClick={addInternship}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            + Add Internship
          </button>

        </div>

        {/* ================= CERTIFICATIONS ================= */}

        <div className="border border-gray-200 bg-white p-4 rounded-lg dark:bg-slate-900 dark:border-slate-700">

          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Certifications
          </h3>

          {formData.certifications.map(
            (certification, index) => (

              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50 dark:bg-slate-800 dark:border-slate-600"
              >

                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Certification {index + 1}
                </h4>

                <input
                  type="text"
                  placeholder="Certification Name"
                  value={certification}
                  onChange={(e) =>
                    updateCertification(
                      index,
                      e.target.value
                    )
                  }
                  className="border border-gray-300 bg-blue-50 text-gray-900 p-2 rounded w-full mb-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-gray-500 dark:placeholder-gray-400"
                />

                {formData.certifications.length > 1 && (

                  <button
                    type="button"
                    onClick={() =>
                      removeCertification(index)
                    }
                    className="bg-red-500 text-white px-4 py-2 rounded"
                  >
                    Remove Certification
                  </button>

                )}

              </div>

            )
          )}

          <button
            type="button"
            onClick={addCertification}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            + Add Certification
          </button>

        </div>

        {/* ================= ACHIEVEMENTS ================= */}

        <div className="border border-gray-200 bg-white p-4 rounded-lg dark:bg-slate-900 dark:border-slate-700">

          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Achievements
          </h3>

          {formData.achievements.map(
            (achievement, index) => (

              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50 dark:bg-slate-800 dark:border-slate-600"
              >

                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Achievement {index + 1}
                </h4>

                <textarea
                  placeholder="Describe your achievement"
                  value={achievement}
                  onChange={(e) =>
                    updateAchievement(
                      index,
                      e.target.value
                    )
                  }
                  className="border border-gray-300 bg-blue-50 text-gray-900 p-2 rounded w-full mb-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-gray-500 dark:placeholder-gray-400"
                  rows="3"
                />

                {formData.achievements.length > 1 && (

                  <button
                    type="button"
                    onClick={() =>
                      removeAchievement(index)
                    }
                    className="bg-red-500 text-white px-4 py-2 rounded"
                  >
                    Remove Achievement
                  </button>

                )}

              </div>

            )
          )}

          <button
            type="button"
            onClick={addAchievement}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            + Add Achievement
          </button>

        </div>

        <button
            type="button"
            onClick={generateResume}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold w-full"
          >
            Generate Resume
        </button>

      </div>
      <div className="bg-white border rounded-xl shadow-sm p-6 lg:sticky lg:top-6 lg:self-start h-fit">

        <h2 className="text-lg font-bold mb-4 text-gray-700">
          Live Resume Preview
        </h2>

        <div className="bg-white border text-gray-900 shadow-sm
                    max-h-[calc(100vh-120px)]
                    overflow-y-auto">

          {/* HEADER */}

          <div className="text-center border-b-2 pb-5 mb-5">

            {/* NAME */}

            <h1 className="text-3xl font-bold text-gray-900">
              {formData.name || "Your Name"}
            </h1>

            {/* EMAIL + PHONE */}

            {(formData.email || formData.phone) && (

              <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 mt-2 text-sm text-gray-600">

                {formData.email && (
                  <span>{formData.email}</span>
                )}

                {formData.email && formData.phone && (
                  <span>•</span>
                )}

                {formData.phone && (
                  <span>{formData.phone}</span>
                )}

              </div>

            )}

            {/* LINKEDIN + GITHUB */}

            {(formData.linkedin || formData.github) && (

              <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 mt-1 text-sm text-blue-600">

                {formData.linkedin && (
                  <span>{formData.linkedin}</span>
                )}

                {formData.linkedin && formData.github && (
                  <span>•</span>
                )}

                {formData.github && (
                  <span>{formData.github}</span>
                )}

              </div>

            )}

          </div>


          {/* CAREER OBJECTIVE */}

          {formData.objective && (

            <div className="mb-5">

              <h3 className="font-bold text-sm border-b pb-1 mb-2 uppercase tracking-wide">
                Career Objective
              </h3>

              <p className="text-sm leading-relaxed">
                {formData.objective}
              </p>

            </div>

          )}


          {/* EDUCATION */}

          {formData.education.some(
            edu =>
              edu.degree ||
              edu.branch ||
              edu.college ||
              edu.cgpa ||
              edu.graduationYear
          ) && (

            <div className="mb-5">

              <h3 className="font-bold text-sm border-b pb-1 mb-2 uppercase tracking-wide">
                EDUCATION
              </h3>

              {formData.education.map((edu, index) => (

                (edu.degree ||
                  edu.branch ||
                  edu.college ||
                  edu.cgpa ||
                  edu.graduationYear) && (

                  <div
                    key={index}
                    className="mb-4"
                  >

                    {(edu.degree || edu.branch) && (
                      <p className="font-semibold text-sm">
                        {edu.degree}
                        {edu.degree && edu.branch && " - "}
                        {edu.branch}
                      </p>
                    )}

                    {edu.college && (
                      <p className="text-sm">
                        {edu.college}
                      </p>
                    )}

                    {(edu.cgpa || edu.graduationYear) && (
                      <p className="text-sm">
                        {edu.cgpa && `CGPA: ${edu.cgpa}`}
                        {edu.cgpa && edu.graduationYear && " | "}
                        {edu.graduationYear &&
                          `Graduation Year: ${edu.graduationYear}`}
                      </p>
                    )}

                  </div>

                )

              ))}

            </div>

          )}


          {/* SKILLS */}

          {formData.skills.length > 0 && (

            <div className="mb-5">

              <h3 className="font-bold text-sm border-b pb-1 mb-2 uppercase tracking-wide">
                TECHNICAL SKILLS
              </h3>

              <p className="text-sm leading-relaxed">
                {formData.skills.join(", ")}
              </p>

            </div>

          )}


          {/* PROJECTS */}

          {formData.projects.some(
            project =>
              project.title ||
              project.description ||
              project.technologies
          ) && (

            <div className="mb-5">

              <h3 className="font-bold text-sm border-b pb-1 mb-2 uppercase tracking-wide">
                PROJECTS
              </h3>

              {formData.projects.map((project, index) => (

                (project.title ||
                  project.description ||
                  project.technologies) && (

                  <div
                    key={index}
                    className="mb-4"
                  >

                    {project.title && (
                      <p className="font-semibold text-sm">
                        {project.title}
                      </p>
                    )}

                    {project.description && (

                      <div className="text-sm whitespace-pre-line">
                        {project.description}
                      </div>

                    )}

                    {project.technologies && (

                      <p className="text-xs mt-1">
                        <span className="font-semibold">
                          Technologies:
                        </span>{" "}
                        {project.technologies}
                      </p>

                    )}

                  </div>

                )

              ))}

            </div>

          )}


          {/* INTERNSHIP */}

          {formData.internships.some(
            internship =>
              internship.company ||
              internship.role ||
              internship.duration ||
              internship.description ||
              internship.projects
            ) && (

            <div className="mb-5">

              <h3 className="font-bold text-sm border-b pb-1 mb-2 uppercase tracking-wide">
                INTERNSHIP EXPERIENCE
              </h3>

              {formData.internships.map((internship, index) => (

                (internship.company ||
                  internship.role ||
                  internship.duration ||
                  internship.description ||
                  internship.projects) && (

                  <div
                    key={index}
                    className="mb-4"
                  >

                    {internship.company && (
                      <p className="font-semibold text-sm">
                        {internship.company}
                      </p>
                    )}

                    {(internship.role || internship.duration) && (
                      <p className="text-sm">
                        {internship.role}

                        {internship.role &&
                          internship.duration &&
                          " | "}

                        {internship.duration}
                      </p>
                    )}

                    {internship.description && (
                      <div className="text-sm whitespace-pre-line">
                        {internship.description}
                      </div>
                    )}

                    {internship.projects && (
                      <div className="text-sm mt-1 whitespace-pre-line">
                        <span className="font-semibold">
                          Projects:
                        </span>

                        {"\n"}

                        {internship.projects}
                      </div>
                    )}

                  </div>

                )

              ))}

            </div>

          )}


          {/* CERTIFICATIONS */}

          {formData.certifications.some(
            certification => certification.trim()
            ) && (

            <div className="mb-5">

              <h3 className="font-bold text-sm border-b pb-1 mb-2 uppercase tracking-wide">
                CERTIFICATIONS
              </h3>

              {formData.certifications.map(
                (certification, index) => (

                  certification.trim() && (

                    <p
                      key={index}
                      className="text-sm mb-1"
                    >
                      • {certification}
                    </p>

                  )

                )
              )}

            </div>

          )}


          {/* ACHIEVEMENTS */}

          {formData.achievements.some(
            achievement => achievement.trim()
            ) && (

            <div className="mb-5">

              <h3 className="font-bold text-sm border-b pb-1 mb-2 uppercase tracking-wide">
                ACHIEVEMENTS
              </h3>

              {formData.achievements.map(
                (achievement, index) => (

                  achievement.trim() && (

                    <p
                      key={index}
                      className="text-sm mb-1"
                    >
                      • {achievement}
                    </p>

                  )

                )
              )}

            </div>

          )}

        </div>

      </div>

    </div>
    </div>
  );
}

export default ResumeBuilder;