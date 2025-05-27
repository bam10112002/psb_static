import React, {useEffect, useState} from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {Badge, Form} from "react-bootstrap";
import {Card, ListGroup} from "react-bootstrap";
import { IMaskInput } from 'react-imask';

import AsyncSelect from 'react-select/async';

const BASE_URL = "https://176-123-166-115.nip.io:444";

export const App = () => {
    const [companyName, setCompanyName] = useState("");
    const [numberOfAccounts, setNumberOfAccounts] = useState("");
    const [inn, setInn] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    const [_selectedValue, _setSelectedValue] = useState(null);

    const [requests, setRequests] = useState([]);


    const [editId, setEditId] = useState(null);
    const [editIdAdditional, setEditIdAdditional] = useState(null);
    const [error, setError] = useState(null);
    const [active, setActive] = useState("left");
    const [user, setUser] = useState(null);

    const options = [
        {value: "40506", label: "Организация в собственности РФ (балансовый счет 40506)"},
        {value: "40606", label: "Организация в собственности субъекта РФ (балансовый счет 40606)"},
        {value: "40706", label: "Негосударственные организации (балансовый счет 40706)"},
        {value: "40825", label: "ИП - исполнитель (балансовый счет 40825)"},
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
        console.log("try get name")
        if (inn.length > 4) {
            console.log("getting name")
            var url = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party";
            var token = "1150d672674291244d58a2fe5727e4e11de332c7";
            var query = inn;

            var options = {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": "Token " + token
                },
                body: JSON.stringify({query: query})
            }

            fetch(url, options)
                .then(response => response.text())
                .then(result => console.log(result))
                .catch(error => console.log("error", error));
        }


    }, [inn]);

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
            // setError(null);
        } catch {
            setError("Ошибка загрузки заявок");
        }
    };


    const validate = () => {
        let newErrors = "";
        console.log("start validate")

        if (editId) {
            if (!editId.company_name.trim()) newErrors = "Введите название компании.";
            if (editId.number_of_accounts <= 0)
                newErrors = "Введите корректное количество счетов.";
            if (!/^\d{10}(\d{2})?$/.test(editId.inn)) newErrors = "ИНН должен содержать 10 или 12 цифр.";
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editId.email)) newErrors = "Введите корректный Email.";
            if (editId.phone_number.length != 17) newErrors = "Введите корректный номер телефона.";
        }
        else
        {
            console.log(phone)
            console.log(phone.length)
            if (!companyName.trim()) newErrors = "Введите название компании.";
            if (!/^\d+$/.test(numberOfAccounts) || parseInt(numberOfAccounts) <= 0)
                newErrors = "Введите корректное количество счетов.";
            if (!/^\d{10}(\d{2})?$/.test(inn)) newErrors = "ИНН должен содержать 10 или 12 цифр.";
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors = "Введите корректный Email.";
            if (phone.length != 17) newErrors = "Введите корректный номер телефона.";
        }

        console.log("end validate")

        setError(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate())
        {
            console.log("validate false")
            return;
        }
        console.log("validate success")

        setError(null);
        if (!user)
        {
            setError("User не найден, повторите позже");
            return
        }

        const userId = user?.id;
        // const userId = 2;
        if (!userId) {
            setError("UserId не найден, повторите позже");
            return;
        }

        let payload;
        if (editId) {
            payload = {
                ...(editId.company_name.trim() && {company_name: editId.company_name.trim()}),
                number_of_accounts: editId.number_of_accounts,
                ...(editId.inn.trim() && {inn: editId.inn.trim()}),
                ...(editId.email.trim() && {email: editId.email.trim()}),
                organizational_form: editId.organizational_form,
                user_id: userId,
                phone_number: editId.phone_number,
                fullname: editId.fullname,
            };

            if (JSON.stringify(editId) === JSON.stringify(editIdAdditional)) {
                setError("Введите хотя бы одно поле для обновления");
                return;
            }
        } else {
            payload = {
                ...(companyName.trim() && {company_name: companyName.trim()}),
                ...(numberOfAccounts.trim() && {number_of_accounts: parseInt(numberOfAccounts.trim())}),
                ...(inn.trim() && {inn: inn.trim()}),
                ...(email.trim() && {email: email.trim()}),
                organizational_form: parseInt(selectedOption),
                user_id: userId,
                ...(phone.trim() && {phone_number: phone.trim()}),
                fullname: user.first_name,
            };
        }

        const url = editId ? `${BASE_URL}/${editId.contract_id}` : BASE_URL;
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
        if (editId)
        {
            window.alert("Заявка была подредактирована.");
        }
        else
        {
            window.alert("Заявка была создана.");

            setCompanyName("");
            setNumberOfAccounts("")
            setInn("")
            setEmail("")
            setPhone("");
        }

        setEditId(null);
        setEditIdAdditional(null);

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

    const customStyles = {
        option: (provided) => ({
            ...provided,
            color: '#212529', // Цвет текста как в Bootstrap
            backgroundColor: 'white', // Фон белый
            '&:hover': {
                backgroundColor: '#f8f9fa' // Цвет при наведении
            }
        }),
        menu: (provided) => ({
            ...provided,
            zIndex: 9999 // Чтобы выпадающий список был поверх других элементов
        })
    };

    // if (!user) return <div>Загрузка данных Telegram...</div>;

    const [selectedOrganization, setSelectedOrganization] = useState(null);
    const loadOptions = async (inputValue) => {
        try {
            var url = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party";
            var token = "1150d672674291244d58a2fe5727e4e11de332c7";
            var query = inputValue;

            var options = {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": "Token " + token
                },
                body: JSON.stringify({query: query})
            }

            return fetch(url, options)
                .then(response => response.text())
                .then(result =>
                {
                    console.log(result)
                    console.log(JSON.parse(result)["suggestions"])
                    return JSON.parse(result)["suggestions"].map(item => ({
                        value: item.data.inn, // ИНН как уникальный идентификатор
                        label: item.value, // Название для отображения
                        fullData: item // Все данные для использования при выборе
                    }));
                }

                )
                .catch(error =>
                    {
                        console.log("error", error)
                        return []; // Возвращаем пустой массив при ошибке
                    }
                );



        } catch (error) {
            console.error('Error fetching data:', error);
            return [];
        }
    };
    const _handleChange = (selected) => {
        console.log('asd')
        setCompanyName(selected.label)
        setInn(selected.value)
        _setSelectedValue(null);
        console.log('Полные данные организации:', selected.fullData);
        // Здесь можно передать данные в родительский компонент или state
    };

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

                                <label className="form-label mt-2 mb-1">Поиск компании</label>
                                <AsyncSelect
                                    value={_selectedValue}
                                    styles={customStyles}
                                    cacheOptions
                                    defaultOptions
                                    loadOptions={loadOptions}
                                    onChange={_handleChange}
                                    placeholder="Введите данные организации..."
                                    noOptionsMessage={() => 'Ничего не найдено'}
                                    loadingMessage={() => 'Загрузка...'}
                                />

                                <label className="form-label mt-2 mb-1">Название компании</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    required={!editId}
                                    readOnly
                                />

                                <label className="form-label mt-2 mb-1">ИНН</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={inn}
                                    onChange={(e) => {
                                        setInn(e.target.value)
                                    }
                                    }
                                    required={!editId}
                                    readOnly

                                />





                                <label className="form-label mt-2 mb-1">Количество счетов</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={numberOfAccounts}
                                    onChange={(e) => setNumberOfAccounts(e.target.value)}
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

                                <label className="form-label mt-2 mb-1">Телефон</label>

                                <IMaskInput
                                    mask="+{7}(000)-000-00-00"
                                    value={phone}
                                    onAccept={(val) => {
                                        setPhone(val)
                                    }


                                }
                                    className="form-control"
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
                            </div>
                        </form>
                    </div>
                )}

                {active === "right"
                    &&
                    (
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
                                                    checked={editId.organizational_form === parseInt(option.value)}
                                                    onChange={() => {
                                                        setEditId((prev) => ({...prev, organizational_form: parseInt(option.value)}))
                                                    }}
                                                    className="mb-3"
                                                />
                                            ))}



                                            <label className="form-label mt-2 mb-1">Название компании</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editId.company_name}
                                                onChange={(e) => setEditId((prev) => ({
                                                    ...prev,
                                                    company_name: e.target.value
                                                }))}
                                                required={!editId}
                                            />

                                            <label className="form-label mt-2 mb-1">Количество счетов</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editId.number_of_accounts}
                                                onChange={(e) => setEditId((prev) => ({
                                                    ...prev,
                                                    number_of_accounts: parseInt(e.target.value)
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

                                            <label className="form-label mt-2 mb-1">Телефон</label>
                                            <IMaskInput
                                                mask="+{7}(000)-000-00-00"
                                                value={editId.phone_number}
                                                onAccept={(val) => setEditId((prev) => ({...prev, phone_number: val}))}
                                                className="form-control"
                                            />

                                        </div>

                                        <div className="text-center mt-4">
                                            <button className="btn btn-primary me-4" type="submit">
                                                Сохранить изменения!
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-secondary ms-2"
                                                onClick={() => {
                                                    setEditId(null);
                                                    setEditIdAdditional(null);
                                                    setError(null);
                                                }}>
                                                Отмена
                                            </button>
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
                                                        <ListGroup.Item><strong>ФИО:</strong> {req.fullname}
                                                        </ListGroup.Item>
                                                        <ListGroup.Item><strong>Телефон:</strong> {req.phone_number}
                                                        </ListGroup.Item>
                                                        <ListGroup.Item><strong>E-mail:</strong> {req.email}
                                                        </ListGroup.Item>
                                                        <ListGroup.Item><strong>Счета:</strong> {req.number_of_accounts}
                                                        </ListGroup.Item>
                                                        <ListGroup.Item><strong>ИНН:</strong> {req.inn}
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

                                    <div className="text-center mt-4">

                                        <button
                                            className="btn btn-primary ms-2"
                                            type="button"
                                            onClick={() => setActive("left")}
                                        >
                                            Создание заявки
                                        </button>
                                    </div>
                                </div>
                            )

                    )
                }
            </div>
        </div>
    );
};


