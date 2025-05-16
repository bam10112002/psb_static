import React, {useEffect, useState} from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {Form} from "react-bootstrap";

const BASE_URL = "https://176-123-166-115.nip.io/api/requests";

const App = () => {


    const [companyName, setCompanyName] = useState("");
    const [numberOfAccounts, setNumberOfAccounts] = useState("");
    const [Inn, setInn] = useState("");
    const [email, setEmail] = useState("");
    const [contractId, setContracId] = useState("");


    // company_name
    // number of accounts
    // Inn
    // email
    // fullname
    // phone_number
    // contract_id
    //
    // user_id


    const [appNumber, setAppNumber] = useState("");
    const [requests, setRequests] = useState([{'ogrn': '13434534'}]);
    const [editId, setEditId] = useState(null);
    const [error, setError] = useState(null);

    const tg = window.Telegram?.WebApp;


    const options = [
        {value: "option1", label: "Организация в собственности РФ (балансовый счет 40506)"},
        {
            value: "option2",
            label: "Организация в собственности субъекта РФ (респ., края, области, города ... ) (балансовый счет 40606)"
        },
        {value: "option3", label: "Негосударственные организации (балансовый счет 40706)"},
        {value: "option4", label: "Индивидуальный предприниматель - исполнитель (балансовый счет 40825)"},
    ];

    const [selectedOption, setSelectedOption] = useState(options[0].value);

    const handleChange = (e) => {
        setSelectedOption(e.target.value);
    };


    useEffect(() => {
        // tg?.ready();
        // fetchRequests();
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

            const userId = 1;
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
            payload = {ogrn: ogrn.trim(), appNumber: appNumber.trim(), userId};
        }

        const url = editId ? `${BASE_URL}/${editId}` : BASE_URL;
        const method = editId ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: {"Content-Type": "application/json"},
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
        window.scrollTo({top: 0, behavior: "smooth"});
        setError(null);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Удалить заявку?")) return;
        try {
            const res = await fetch(`${BASE_URL}/${id}`, {method: "DELETE"});
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

        <div className="container-sm">
            <h1 className="mb-1 fs-bold ">{editId ? "Редактирование заявки" : "Создание заявки"}</h1>
            <div className="card mb-0">
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                      {error && (
                          <div className="alert alert-danger" role="alert">
                            {error}
                          </div>
                      )}

                        <div className="mb-0">
                            <div className="">
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
                            </div>


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
                                value={Inn}
                                onChange={(e) => setInn(e.target.value)}
                                required={!editId}
                            />

                            <label className="form-label mt-2 mb-1">e-mail</label>
                            <input
                                type="text"
                                className="form-control"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required={!editId}
                            />
                        </div>


                      <div className="text-center mt-4">
                        <button className="btn btn-primary" type="submit">
                          {editId ? "Сохранить изменения" : "Создать заявку"}
                        </button>
                      </div>


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

            {/*<h3>Ваши заявки</h3>*/}
            {/*<ul className="list-group">*/}
            {/*  {requests.length === 0 && <li className="list-group-item">Заявок нет</li>}*/}
            {/*  {requests.map((req) => (*/}
            {/*    <li*/}
            {/*      key={req.id}*/}
            {/*      className="list-group-item d-flex justify-content-between align-items-center"*/}
            {/*    >*/}
            {/*      <div>*/}
            {/*        <strong>ОГРН:</strong> {req.ogrn}*/}
            {/*        <br />*/}
            {/*        <strong>Номер:</strong> {req.appNumber}*/}
            {/*      </div>*/}
            {/*      <div>*/}
            {/*        <button*/}
            {/*          className="btn btn-sm btn-outline-secondary me-2"*/}
            {/*          onClick={() => handleEdit(req)}*/}
            {/*        >*/}
            {/*          ✏️*/}
            {/*        </button>*/}
            {/*        <button*/}
            {/*          className="btn btn-sm btn-outline-danger"*/}
            {/*          onClick={() => handleDelete(req.id)}*/}
            {/*        >*/}
            {/*          🗑️*/}
            {/*        </button>*/}
            {/*      </div>*/}
            {/*    </li>*/}
            {/*  ))}*/}
            {/*</ul>*/}
        </div>
    );
};

export default App;
