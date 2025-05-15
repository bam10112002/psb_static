import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const BASE_URL = "http://176.123.166.115:8000";

const App = () => {
  const [ogrn, setOgrn] = useState("");
  const [appNumber, setAppNumber] = useState("");
  const [requests, setRequests] = useState([]);
  const [editId, setEditId] = useState(null);

  const tg = window.Telegram.WebApp;

  useEffect(() => {
    tg.ready();
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const userId = tg.initDataUnsafe?.user?.id;
      const res = await fetch(`${BASE_URL}/api/requests?userId=${userId}`);
      const data = await res.json();
      setRequests(data);
    } catch (e) {
      console.error("Ошибка загрузки заявок", e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = tg.initDataUnsafe?.user?.id;
    const payload = { ogrn, appNumber, userId };

    const url = editId
      ? `${BASE_URL}/api/requests/${editId}`
      : `${BASE_URL}/api/requests`;

    const method = editId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setOgrn("");
      setAppNumber("");
      setEditId(null);
      fetchRequests();
    }
  };

  const handleEdit = (req) => {
    setEditId(req.id);
    setOgrn(req.ogrn);
    setAppNumber(req.appNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Удалить заявку?")) return;
    await fetch(`${BASE_URL}/api/requests/${id}`, { method: "DELETE" });
    fetchRequests();
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Создание заявки</h2>
      <div className="card mb-4">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">ОГРН</label>
              <input
                type="text"
                className="form-control"
                value={ogrn}
                onChange={(e) => setOgrn(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Номер заявки</label>
              <input
                type="text"
                className="form-control"
                value={appNumber}
                onChange={(e) => setAppNumber(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit">
              {editId ? "Сохранить изменения" : "Создать заявку"}
            </button>
          </form>
        </div>
      </div>

      <h3>Ваши заявки</h3>
      <ul className="list-group">
        {requests.map((req) => (
          <li key={req.id} className="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <strong>ОГРН:</strong> {req.ogrn}<br />
              <strong>Номер:</strong> {req.appNumber}
            </div>
            <div>
              <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => handleEdit(req)}>
                ✏️
              </button>
              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(req.id)}>
                🗑️
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
