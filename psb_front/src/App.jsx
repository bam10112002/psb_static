import React, {useEffect, useState} from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {Badge, Form} from "react-bootstrap";
import {Card, ListGroup} from "react-bootstrap";


const BASE_URL = "https://176-123-166-115.nip.io:444";

const App = () => {
    const [companyName, setCompanyName] = useState("");
    const [numberOfAccounts, setNumberOfAccounts] = useState("");
    const [inn, setInn] = useState("");
    const [email, setEmail] = useState("");


    const [requests, setRequests] = useState([]);


    const [editId, setEditId] = useState(null);
    const [editIdAdditional, setEditIdAdditional] = useState(null);
    const [error, setError] = useState(null);
    const [active, setActive] = useState("left");
    const [user, setUser] = useState(null);

    const options = [
        {value: "1", label: "Организация в собственности РФ (балансовый счет 40506)"},
        {value: "2", label: "Организация в собственности субъекта РФ (балансовый счет 40606)"},
        {value: "3", label: "Негосударственные организации (балансовый счет 40706)"},
        {value: "4", label: "ИП - исполнитель (балансовый счет 40825)"},
    ];

    const [selectedOption, setSelectedOption] = useState(options[0].value);

    const handleChange = (e) => {
        setSelectedOption(e.target.value);
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case "OPEN":
                return "success";
            case "CLOSED":
                return "secondary";
            default:
                return "dark";
        }
    };

    useEffect(() => {
        console.log("hello")
        if (!user) {
            const tg = window.Telegram?.WebApp;
            if (tg?.initDataUnsafe?.user) {
                setUser(tg.initDataUnsafe.user);
                tg.ready();
            } else {
                setError("Ошибка инициализации Telegram WebApp. Перезапустите приложение.");
            }
        } else {
            fetchRequests().then(() => {
            });
        }
    }, [user]);

    const fetchRequests = async () => {
        try {
            if (!user) {
                setError("Пользовательские данные не найдены в Telegram");
                return;
            }

            const res = await fetch(`${BASE_URL}/${user.id}`);
            if (!res.ok) return;
            // if (!res.ok) throw new Error(`Ошибка загрузки заявок: ${res.status}`);
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
        if (!user)
            return

        const userId = user?.id;
        // const userId = 2;
        if (!userId) {
            setError("UserId не найден, повторите позже");
            return;
        }

        let payload;
        if (editId) {
            payload = {};
            payload = {
                ...(editId.company_name.trim() && {company_name: editId.company_name.trim()}),
                ...(editId.number_of_accounts.trim() && {number_of_accounts: parseInt(editId.number_of_accounts.trim())}),
                ...(editId.inn.trim() && {inn: editId.inn.trim()}),
                ...(editId.email.trim() && {email: editId.email.trim()}),
                organizational_form: parseInt(editId.organizational_form),
                user_id: userId,
                phone_number: editId.phone_number,
                fullname: editId.fullname,
            };

            // if (JSON.stringify(editId) === JSON.stringify(editIdAdditional)) {
            //     setError("Введите хотя бы одно поле для обновления");
            //     return;
            // }
        } else {
            payload = {
                ...(companyName.trim() && {company_name: companyName.trim()}),
                ...(numberOfAccounts.trim() && {number_of_accounts: parseInt(numberOfAccounts.trim())}),
                ...(inn.trim() && {inn: inn.trim()}),
                ...(email.trim() && {email: email.trim()}),
                organizational_form: parseInt(selectedOption),
                user_id: userId,
                phone_number: "880800808080",
                fullname: user.first_name,
            };
        }

        const url = editId ? `${BASE_URL}/${editId}` : BASE_URL;
        const method = editId ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            setError("Ошибка при сохранении заявки");

            return
        }

        await res.json();
        setEditId(null);
        fetchRequests();

    };

    const handleEdit = (req) => {
        setEditId(req);
        setEditIdAdditional(req);
        window.scrollTo({top: 0, behavior: "smooth"});
        setError(null);
    };
    const handleDelete = async (id) => {
        if (!window.confirm("Удалить заявку?")) return;
        try {
            const res = await fetch(`${BASE_URL}/${id}`, {method: "DELETE"});
            if (!res.ok) throw new Error(`Ошибка удаления: ${res.status}`);
            fetchRequests();
        } catch {
            setError("Ошибка удаления заявки");
        }
    };

    // if (!user) return <div>Загрузка данных Telegram...</div>;

    return (
        <div className="container-sm  mx-auto " style={{minWidth: "375px"}}>

            <h1 className="mb-1 fs-bold">
                {active === "left"
                    ? editId ? "Редактирование заявки" : "Создание заявки"
                    : "Мои заявки"}
            </h1>

            {error && <span className="text-danger d-block mb-2">{error}</span>}

            <div className="card mb-0" style={{maxHeight: '85vh', overflowY: 'auto'}}>
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

                {active === "right"

                &&
                editId ? (
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
                                            checked={editId.organizational_form === option.value}
                                            onChange={()=>{setEditId((prev) => ({...prev, organizational_form: option.value}))}}
                                            className="mb-3"
                                        />
                                    ))}

                                    <label className="form-label mt-2 mb-1">Название компании</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={editId.company_name}
                                        onChange={(e) => setEditId((prev) => ({...prev, company_name: e.target.value}))}
                                        required={!editId}
                                    />

                                    <label className="form-label mt-2 mb-1">Количество счетов</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={editId.number_of_accounts}
                                        onChange={(e) => setEditId((prev) => ({
                                            ...prev,
                                            number_of_accounts: e.target.value
                                        }))}
                                        required={!editId}
                                    />

                                    <label className="form-label mt-2 mb-1">ИНН</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={editId.inn}
                                        onChange={(e) => setEditId((prev) => ({...prev, inn: e.target.value}))}
                                        required={!editId}
                                    />

                                    <label className="form-label mt-2 mb-1">Email</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={editId.email}
                                        onChange={(e) => setEditId((prev) => ({...prev, email: e.target.value}))}
                                        required={!editId}
                                    />
                                </div>

                                <div className="text-center mt-4">
                                    <button className="btn btn-primary me-4" type="submit">
                                        {editId ? "Сохранить изменения" : "Создать заявку"}
                                    </button>

                                    {!editId && (
                                    <button
                                        className="btn btn-primary ms-2"
                                        type="button"
                                        onClick={() => setActive("right")}
                                    >
                                        Мои заявки
                                    </button>
                                    )}
                                    {editId && (
                                        <button
                                            type="button"
                                            className="btn btn-secondary ms-2"
                                            onClick={() => {
                                                setEditId(null);
                                                setError(null);
                                            }}
                                        >
                                            Отмена
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    ) :


                    (
                        <div className="card-body">
                            {/*<div className="list-group">*/}
                            {/*{requests[0]}*/}
                            {requests.length === 0 ? <li className="list-group-item">Заявок нет</li>
                                :
                                requests.map((req) => (

                                    <Card key={`card-${req.contract_id}`} className="mb-3 shadow-sm rounded-4"
                                          style={{fontSize: "0.95rem"}}>
                                        <Card.Body className="p-3">
                                            <Card.Title className="mb-2 fs-6">
                                                {req.company_name}
                                                <Badge bg={getStatusVariant(req.status)} className="ms-2">
                                                    {req.status}
                                                </Badge>
                                            </Card.Title>

                                            <ListGroup variant="flush" className="mt-2">
                                                <ListGroup.Item><strong>Орг.
                                                    форма:</strong> {req.organizational_form}
                                                </ListGroup.Item>
                                                <ListGroup.Item><strong>Счета:</strong> {req.number_of_accounts}
                                                </ListGroup.Item>
                                                <ListGroup.Item><strong>ИНН:</strong> {req.inn}</ListGroup.Item>
                                                <ListGroup.Item><strong>E-mail:</strong> {req.email}
                                                </ListGroup.Item>
                                                <ListGroup.Item><strong>ФИО:</strong> {req.fullname}
                                                </ListGroup.Item>
                                                <ListGroup.Item><strong>Телефон:</strong> {req.phone_number}
                                                </ListGroup.Item>
                                            </ListGroup>
                                            <div className="text-end mt-1">
                                                <button
                                                    className="btn btn-sm btn-outline-secondary me-2"
                                                    onClick={() => handleEdit(req)}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDelete(req.contract_id)}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </Card.Body>
                                    </Card>


                                ))}
                            {/*</div>*/}
                        </div>
                    )}
            </div>
        </div>
    );
};

export default App;
