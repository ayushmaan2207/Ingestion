import React, { useState } from "react";
import axios from "axios";

import { toast } from "react-toastify";

const ClickhouseForm = ({
  tables,
  columns,
  setColumns,
  formData,
  setSelectedColumns,
  setSelectedTable,
  setFormData,
  selectedTable,
  setLoad
}) => {
  const [checkedCols, setCheckedCols] = useState([]);

  const handleTableSelect = async (e) => {
    try {
      setLoad(true);
      const tableName = e.target.value;
      setSelectedTable(tableName);
      const res = await axios.post("http://localhost:5000/clickhouse/columns", {
        ...formData,
        tableName,
      });
      if (res.data.success) {
        setColumns(res.data.columns.columns);
      setLoad(false);
      setCheckedCols([]);
      }
    } catch (error) {
      setLoad(false);
      console.log(error);
      setColumns([]);
    }
  };

  const toggleColumn = (col) => {
    const updated = checkedCols.includes(col)
      ? checkedCols.filter((c) => c !== col)
      : [...checkedCols, col];
    setCheckedCols(updated);
    setSelectedColumns(updated);
  };

  const handleIngestToCSV = async () => {
    setLoad(true);

    if (checkedCols.length === 0) {
      setLoad(false);
      toast.error("No columns selected.");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/clickhouse/ingest/csv",
        {
          ...formData,
          tableName: selectedTable,
          columns: checkedCols,
          fileName: selectedTable,
        },
        {
          responseType: "json", // Change to "json" instead of "blob"
        }
      );

      // Get row count from the response
      const { csvData, rowCount, fileName } = res.data;

      // Convert CSV data (string) into a Blob
      const blob = new Blob([csvData], { type: "text/csv" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${fileName}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setLoad(false);
      // Show success toast with row count
      toast.success(`CSV file downloaded successfully! Rows: ${rowCount}`);
    } catch (err) {
      setLoad(false);
      console.error(err);
      toast.error("Failed to download CSV.");
    }
  };

  return (
    <>
      {tables.length > 0 && (
        <div className="table">
          <h3>Select Table:</h3>
          <select value={selectedTable} onChange={handleTableSelect}>
            <option value="">--Choose Table--</option>
            {tables.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}

      {columns.length > 0 && (
        <div className="column">
          <h3>Select Columns:</h3>
          <div className="colbox">
            {columns.map((col) => (
              <label key={col} className="col-item">
                <input
                  type="checkbox"
                  checked={checkedCols.includes(col)}
                  onChange={() => toggleColumn(col)}
                />
                {col}
              </label>
            ))}
          </div>
          <button className="submitBtn" onClick={handleIngestToCSV}>Start Ingestion</button>
        </div>
      )}
    </>
  );
};

export default ClickhouseForm;
