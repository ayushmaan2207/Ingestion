import "./App.css";
import React, { useState, useEffect } from "react";
import ClickhouseForm from "./components/ClickhouseForm";
import CSVUploader from "./components/CSVUploader";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AiOutlineEyeInvisible, AiOutlineEye } from "react-icons/ai";
import Spinner from "./components/Spinner";

function App() {
  const [load, setLoad] = useState(false);
  const [mode, setMode] = useState(true);
  const [connected, setConnected] = useState(false);

  const [selectedColumns, setSelectedColumns] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [formData, setFormData] = useState({});
  const [passVis, setPassVis] = useState(false);

  const newData = {
    host: "",
    port: "",
    database: "",
    user: "",
    password: "",
  };

  const [localFormData, setLocalFormData] = useState(newData);
  const [tables, setTables] = useState([]);
  const [columns, setColumns] = useState([]);

  // Auto reconnect from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("jwt");
    const savedUserInfo = localStorage.getItem("userInfo");
    
    if (savedToken && savedUserInfo) {
      setLoad(true);
      try {
        const parsedUserInfo = JSON.parse(savedUserInfo);
        setFormData(parsedUserInfo);

        axios
          .post("http://localhost:5000/clickhouse/tables", parsedUserInfo)
          .then((res) => {
            if (res.data.success) {
              setTables(res.data.tables.tables);
              setConnected(true);
              setLoad(false);
            } else {
              setLoad(false);
              setConnected(false);
              toast.error("Session expired, please reconnect.");
              localStorage.removeItem("jwt");
              localStorage.removeItem("userInfo");
            }
          })
          .catch((err) => {
            setLoad(false);
            setConnected(false);
            console.error(err);
            toast.error("Auto reconnect failed.");
          });
      } catch (e) {
        setLoad(false);
        setConnected(false);
        console.error("Corrupted localStorage data", e);
      }
    }
  }, []);

  // Manual connection
  const handleConnect = async (event) => {
    event.preventDefault();
    setLoad(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/clickhouse/tables",
        localFormData
      );

      if (res.data.success) {
        toast.success(res.data.message);
        setTables(res.data.tables.tables);
        setSelectedTable("");
        setColumns([]);
        setLocalFormData(newData);

        localStorage.setItem("jwt", res.data.token);
        localStorage.setItem("userInfo", JSON.stringify(res.data.userInfo));
        setFormData(res.data.userInfo);
        setConnected(true);
        setLoad(false);
      } else {
        setLoad(false);
        setConnected(false);
        toast.error(res.data.message);
      }
    } catch (error) {
      setLoad(false);
      setConnected(false);
      console.log(error);
      toast.error(error.response?.data?.message || "Something went wrong.");
    }
  };

  const handleChange = (e) => {
    const updatedForm = { ...localFormData, [e.target.name]: e.target.value };
    setLocalFormData(updatedForm);
    setFormData(updatedForm);
  };

  return (
    <>
      {load ? <Spinner /> : <></>}
      <div className="App">
        <div className="up">
          <h1>ClickHouse ↔ Flat File</h1>
          <h2>Ingestion Tool</h2>
        </div>

        <div className="down">
          <div className="left">
            <form onSubmit={handleConnect}>
              <label htmlFor="host" className="form-label">
                Host*
                <input
                  className="form-control"
                  type="text"
                  required
                  name="host"
                  value={localFormData.host}
                  onChange={handleChange}
                />
              </label>

              <label htmlFor="port" className="form-label">
                Port*
                <input
                  className="form-control"
                  type="text"
                  required
                  name="port"
                  value={localFormData.port}
                  onChange={handleChange}
                />
              </label>

              <label htmlFor="database" className="form-label">
                Database*
                <input
                  className="form-control"
                  type="text"
                  required
                  name="database"
                  value={localFormData.database}
                  onChange={handleChange}
                />
              </label>

              <label htmlFor="user" className="form-label">
                User*
                <input
                  className="form-control"
                  type="text"
                  required
                  name="user"
                  value={localFormData.user}
                  onChange={handleChange}
                />
              </label>

              <label htmlFor="password" className="form-label">
                Password*
                <div className="eyecont">
                  <input
                    className="form-control"
                    name="password"
                    value={localFormData.password}
                    onChange={handleChange}
                    required
                    type={passVis ? "text" : "password"}
                  />
                  <span className="eye" onClick={() => setPassVis(!passVis)}>
                    {passVis ? <AiOutlineEye /> : <AiOutlineEyeInvisible />}
                  </span>
                </div>
              </label>
              <br />
              <button className="submitBtn" type="submit">
                Connect
              </button>
            </form>
          </div>

          <div className="right">
            <div className="box">
              <div className="toggle">
                <button
                  className="togglebtn submitBtn"
                  onClick={() => setMode(true)}
                  style={{
                    backgroundColor: mode ? "#372f29" : "#f0f0f0",
                    color: mode ? "#faf9f6" : "#372f29",
                  }}
                >
                  ClickHouse
                </button>
                <button
                  className="togglebtn submitBtn"
                  onClick={() => setMode(false)}
                  style={{
                    backgroundColor: !mode ? "#372f29" : "#f0f0f0",
                    color: !mode ? "#faf9f6" : "#372f29",
                  }}
                >
                  Flat File
                </button>
              </div>

              {mode ? (
                <ClickhouseForm
                  tables={tables}
                  columns={columns}
                  setColumns={setColumns}
                  formData={formData}
                  selectedTable={selectedTable}
                  setSelectedColumns={setSelectedColumns}
                  setSelectedTable={setSelectedTable}
                  setFormData={setFormData}
                  setLoad={setLoad}
                />
              ) : (
                connected && <CSVUploader formData={formData} setLoad={setLoad} />
              )}
            </div>
          </div>
        </div>

        <ToastContainer />
      </div>
    </>
  );
}

export default App;
