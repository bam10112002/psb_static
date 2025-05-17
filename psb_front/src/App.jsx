import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Form } from "react-bootstrap";

const BASE_URL = "https://176-123-166-115.nip.io:444";

const App = () => {
  const [companyName, setCompanyName] = useState("");
  const [numberOfAccounts, setNumberOfAccounts] = useState("");
  const [inn, setInn] = useState("");
  const [email, setEmail] = useState("");
  const [appNumber, setAppNumber] = useState("");
  const [requests, setRequests] = useState([]);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState(null);
  const [active, setActive] = useState("left");
  const [user, setUser] = useState(null);

  const options = [
    { value: "1", label: "Организация в собственности РФ (балансовый счет 40506)" },
    { value: "2", label: "Организация в собственности субъекта РФ (балансовый счет 40606)" },
    { value: "3", label: "Негосударственные организации (балансовый счет 40706)" },
    { value: "4", label: "ИП - исполнитель (балансовый счет 40825)" },
  ];

  const [selectedOption, setSelectedOption] = useState(options[0].value);

  const handleChange = (e) => {
    setSelectedOption(e.target.value);
  };

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg?.initDataUnsafe?.user) {
      setUser(tg.initDataUnsafe.user);
      tg.ready();
    } else {
      setError("Ошибка инициализации Telegram WebApp. Перезапустите приложение.");
    }
  }, []);

  const fetchRequests = async () => {
    try {
      if (!user?.id) {
        setError("Пользовательские данные не найдены в Telegram");
        return;
      }

      const res = await fetch(`${BASE_URL}/${user.id}`);
      if (!res.ok) throw new Error(`Ошибка загрузки заявок: ${res.status}`);
      const data = await res.json();
      setRequests(data);
      setError(null);
    } catch {
      setError("Ошибка загрузки заявок");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const userId = user?.id;
    if (!userId) {
      setError("UserId не найден, повторите позже");
      return;
    }

    let payload;
    if (editId) {
      payload = {};
      if (companyName.trim()) payload.company_name = companyName.trim();
      if (numberOfAccounts.trim()) payload.number_of_accounts = parseInt(numberOfAccounts.trim());
      if (inn.trim()) payload.inn = inn.trim();
      if (email.trim()) payload.email = email.trim();
      payload.organizational_form = parseInt(selectedOption);
      payload.user_id = userId;
      payload.phone_number = "880800808080";
      payload.fullname = "full";

      if (Object.keys(payload).length === 0) {
        setError("Введите хотя бы одно поле для обновления");
        return;
      }
    } else {
      payload = {
        ...(companyName.trim() && { company_name: companyName.trim() }),
        ...(numberOfAccounts.trim() && { number_of_accounts: parseInt(numberOfAccounts.trim()) }),
        ...(inn.trim() && { inn: inn.trim() }),
        ...(email.trim() && { email: email.trim() }),
        organizational_form: parseInt(selectedOption),
        user_id: userId,
        phone_number: "880800808080",
        fullname: "full",
      };
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

      await res.json();
      setAppNumber("");
      setEditId(null);
      fetchRequests();
    } catch {
      setError("Ошибка при сохранении заявки");
    }
  };

  const handleEdit = (req) => {
    setEditId(req.id);
    setAppNumber(req.appNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setError(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Удалить заявку?")) return;
    try {
      const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Ошибка удаления: ${res.status}`);
      fetchRequests();
    } catch {
      setError("Ошибка удаления заявки");
    }
  };

  if (!user) return <div>Загрузка данных Telegram...</div>;

  return (
    <div className="container-sm">
      <h1>Привет, {user.first_name}!</h1>
      {user.last_name && <p>Фамилия: {user.last_name}</p>}
      <p>Юзернейм: @{user.username}</p>
      <p>Telegram ID: {user.id}</p>

      <h1 className="mb-1 fs-bold">
        {active === "left"
          ? editId ? "Редактирование заявки" : "Создание заявки"
          : "Мои заявки"}
      </h1>

      {error && <span className="text-danger d-block mb-2">{error}</span>}

      <div className="card mb-0">
        {active === "left" && (
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-0">
                {options.map((option, index) => (
                  <Form.Check
                    key={option.value}
                    type="radio"
                    id={`radio-${index}`}
                    label={option.label}
                    name="radioGroup"
                    value={option.value}
                    checked={selectedOption === option.value}
                    onChange={handleChange}
                    className="mb-3"
                  />
                ))}

                <label className="form-label mt-2 mb-1">Название компании</label>
                <input
                  type="text"
                  className="form-control"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required={!editId}
                />

                <label className="form-label mt-2 mb-1">Количество счетов</label>
                <input
                  type="text"
                  className="form-control"
                  value={numberOfAccounts}
                  onChange={(e) => setNumberOfAccounts(e.target.value)}
                  required={!editId}
                />

                <label className="form-label mt-2 mb-1">ИНН</label>
                <input
                  type="text"
                  className="form-control"
                  value={inn}
                  onChange={(e) => setInn(e.target.value)}
                  required={!editId}
                />

                <label className="form-label mt-2 mb-1">Email</label>
                <input
                  type="text"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required={!editId}
                />
              </div>

              <div className="text-center mt-4">
                <button className="btn btn-primary me-4" type="submit">
                  {editId ? "Сохранить изменения" : "Создать заявку"}
                </button>
                <button
                  className="btn btn-primary ms-2"
                  type="button"
                  onClick={() => setActive("right")}
                >
                  Мои заявки
                </button>
                {editId && (
                  <button
                    type="button"
                    className="btn btn-secondary ms-2"
                    onClick={() => {
                      setEditId(null);
                      setAppNumber("");
                      setError(null);
                    }}
                  >
                    Отмена
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {active === "right" && (
          <div className="card-body">
            <h3>Ваши заявки</h3>
            <ul className="list-group">
              {requests.length === 0 && <li className="list-group-item">Заявок нет</li>}
              {requests.map((req) => (
                <li
                  key={req.id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <div>
                    <strong>ОГРН:</strong> {req.ogrn}<br />
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
        )}
      </div>
    </div>
  );
};

export default App;
