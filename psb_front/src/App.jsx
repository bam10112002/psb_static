import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const BASE_URL = "https://176-123-166-115.nip.io/api/requests";

const App = () => {
  const [ogrn, setOgrn] = useState("");
  const [appNumber, setAppNumber] = useState("");
  const [requests, setRequests] = useState([]);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState(null);

  const tg = window.Telegram?.WebApp;

  useEffect(() => {
    tg?.ready();
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      if (!tg) {
        setError("Telegram WebApp не найден");
        return;
      }
      
      // Ждём готовности и получаем userId
      tg.ready();
  
      const user = 1;
      if (!user) {
        setError("Пользовательские данные не найдены в Telegram");
        return;
      }
  
      const userId = user.id;
      console.log("User ID:", userId);
  
      const res = await fetch(`${BASE_URL}?userId=${userId}`);
      if (!res.ok) {
        throw new Error(`Ошибка при загрузке заявок: ${res.status}`);
      }
      const data = await res.json();
      setRequests(data);
      setError(null);
    } catch (e) {
      console.error("Ошибка загрузки заявок", e);
      setError("Ошибка загрузки заявок");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const userId = 1
    if (!userId) {
      setError("UserId не найден, повторите попытку позже");
      return;
    }

    // Формируем тело запроса
    let payload;
    if (editId) {
      // PUT можно отправлять частично, только поля которые заполнены
      payload = {};
      if (ogrn.trim()) payload.ogrn = ogrn.trim();
      if (appNumber.trim()) payload.appNumber = appNumber.trim();
      if (Object.keys(payload).length === 0) {
        setError("Введите хотя бы одно поле для обновления");
        return;
      }
    } else {
      // POST — все обязательные поля
      if (!ogrn.trim() || !appNumber.trim()) {
        setError("ОГРН и Номер заявки обязательны");
        return;
      }
      payload = { ogrn: ogrn.trim(), appNumber: appNumber.trim(), userId };
    }

    const url = editId ? `${BASE_URL}/${editId}` : BASE_URL;
    const method = editId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Ошибка сервера: ${res.status} ${errorText}`);
      }

      const result = await res.json();

      setOgrn("");
      setAppNumber("");
      setEditId(null);
      fetchRequests();
    } catch (e) {
      console.error("Ошибка при сохранении заявки", e);
      setError("Ошибка при сохранении заявки");
    }
  };

  const handleEdit = (req) => {
    setEditId(req.id);
    setOgrn(req.ogrn);
    setAppNumber(req.appNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setError(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Удалить заявку?")) return;
    try {
      const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error(`Ошибка удаления: ${res.status}`);
      }
      fetchRequests();
    } catch (e) {
      console.error("Ошибка удаления заявки", e);
      setError("Ошибка удаления заявки");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-3">{editId ? "Редактирование заявки" : "Создание заявки"}</h2>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

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
                required={!editId}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Номер заявки</label>
              <input
                type="text"
                className="form-control"
                value={appNumber}
                onChange={(e) => setAppNumber(e.target.value)}
                required={!editId}
              />
            </div>
            <button className="btn btn-primary" type="submit">
              {editId ? "Сохранить изменения" : "Создать заявку"}
            </button>
            {editId && (
              <button
                type="button"
                className="btn btn-secondary ms-2"
                onClick={() => {
                  setEditId(null);
                  setOgrn("");
                  setAppNumber("");
                  setError(null);
                }}
              >
                Отмена
              </button>
            )}
          </form>
        </div>
      </div>

      <h3>Ваши заявки</h3>
      <ul className="list-group">
        {requests.length === 0 && <li className="list-group-item">Заявок нет</li>}
        {requests.map((req) => (
          <li
            key={req.id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <div>
              <strong>ОГРН:</strong> {req.ogrn}
              <br />
              <strong>Номер:</strong> {req.appNumber}
            </div>
            <div>
              <button
                className="btn btn-sm btn-outline-secondary me-2"
                onClick={() => handleEdit(req)}
              >
                ✏️
              </button>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => handleDelete(req.id)}
              >
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
