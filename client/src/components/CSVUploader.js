import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const CSVUploader = ({ formData,setLoad }) => {
  const [form, setForm] = useState({
    host: formData.host,
    port: formData.port,
    database: formData.database,
    user: formData.user,
    password: formData.password,
    tableName: "",
  });
  const [csvFile, setCsvFile] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoad(true);
    if (!csvFile) return toast.error("Please upload a CSV file.");

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    data.append("csv", csvFile);

    try {
      const res = await axios.post(
        "http://localhost:5000/clickhouse/upload",
        data
      );
      if (res.data.success) {
        window.location.reload();
        toast.success(res.data.message);
      }
    } catch (err) {
      setLoad(false);
      toast.error(
        "Upload failed: " + (err.response?.data?.error || err.message)
      );
    }
  };

  return (
      <form className="submitForm" onSubmit={handleSubmit}>
        <div className="boxfile">
          <label htmlFor="tableName" className="form-table">
            <h3>Table Name:</h3>
            <input
              className="form-control"
              type="text"
              name="tableName"
              onChange={handleChange}
              required
            />
          </label>
          <input
            className="fileInput"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            required
          />
        </div>
        <button className="submitBtn" type="submit">
          Upload CSV
        </button>
      </form>
  );
};

export default CSVUploader;
