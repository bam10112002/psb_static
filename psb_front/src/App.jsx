import React, {useEffect, useState} from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {Form} from "react-bootstrap";

const BASE_URL = "https://176-123-166-115.nip.io:444";

const App = () => {


    const [companyName, setCompanyName] = useState("");
    const [numberOfAccounts, setNumberOfAccounts] = useState("");
    const [Inn, setInn] = useState("");
    const [email, setEmail] = useState("");
    const [appNumber, setAppNumber] = useState("");
    const [requests, setRequests] = useState([{'ogrn': '13434534'}]);
    const [editId, setEditId] = useState(null);
    const [error, setError] = useState(null);
    const [active, setActive] = useState("left");



    const options = [
        {value: "1", label: "Организация в собственности РФ (балансовый счет 40506)"},
        {
            value: "2",
            label: "Организация в собственности субъекта РФ (респ., края, области, города ... ) (балансовый счет 40606)"
        },
        {value: "3", label: "Негосударственные организации (балансовый счет 40706)"},
        {value: "4", label: "Индивидуальный предприниматель - исполнитель (балансовый счет 40825)"},
    ];

    const [selectedOption, setSelectedOption] = useState(options[0].value);

    const handleChange = (e) => {
        setSelectedOption(e.target.value);
    };

    const [user, setUser] = useState(null);
    useEffect(() => {
        const tg = window.Telegram.WebApp;

        if (tg?.initDataUnsafe?.user) {
            setUser(tg.initDataUnsafe.user);
        } else {
            // Telegram WebApp не инициализирован
            console.warn('Telegram WebApp is not initialized or user not found.');
        }

        tg?.ready(); // Сообщить Telegram, что WebApp готов
    }, []);


    const fetchRequests = async () => {
        try {
            const user = 1;
            if (!user) {
                setError("Пользовательские данные не найдены в Telegram");
                return;
            }

            const userId = 1;
            console.log("User ID:", userId);

            const res = await fetch(`${BASE_URL}/${user.id}`);
            if (!res.ok) {
                throw new Error(`Ошибка при загрузке заявок: ${res.status}`);
            }
            const data = await res.json();
            console.log(data);
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
            if (companyName.trim()) payload.company_name = companyName.trim();
            if (numberOfAccounts.trim()) payload.number_of_accounts = parseInt(numberOfAccounts.trim());
            if (Inn.trim()) payload.inn = Inn.trim();
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
            // POST — все обязательные поля
            payload = {
                ...(companyName.trim() && { company_name: companyName.trim() }),
                ...(numberOfAccounts.trim() && { number_of_accounts: parseInt(numberOfAccounts.trim()) }),
                ...(Inn.trim() && { inn: Inn.trim() }),
                ...(email.trim() && { email: email.trim() }),
                organizational_form: parseInt(selectedOption),
                user_id: userId,
                phone_number: "880800808080",
                fullname: "full",
            };

        }
        console.log(payload)
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

            // setOgrn("");
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
        <div className="App">
            <h1>Привет, {user.first_name}!</h1>
            {user.last_name && <p>Фамилия: {user.last_name}</p>}
            <p>Юзернейм: @{user.username}</p>
            <p>Telegram ID: {user.id}</p>
            <img src={user.photo_url} alt="avatar" width="100" style={{ borderRadius: '50%' }} />
        </div>
        // <div className="container-sm">
        //
        //     <h1>Привет, {user.first_name}!</h1>
        //     {user.last_name && <p>Фамилия: {user.last_name}</p>}
        //     <p>Юзернейм: @{user.username}</p>
        //     <p>Telegram ID: {user.id}</p>
        //     <h1 className="mb-1 fs-bold ">
        //         {active == "left" ?
        //         editId ? "Редактирование заявки" : "Создание заявки"
        //         :"Мои заявки"
        //         }</h1>
        //
        //     {/*{user}*/}
        //     {/*{user.id}*/}
        //     {/*{active == "left" &&*/}
        //
        //     <div className="card mb-0">
        //         {active=="left" &&
        //         <div className="card-body">
        //             <form onSubmit={handleSubmit}>
        //               {error && (
        //                   <div className="alert alert-danger" role="alert">
        //                     {error}
        //                   </div>
        //               )}
        //
        //                 <div className="mb-0">
        //                     <div className="">
        //                         {options.map((option, index) => (
        //                             <Form.Check
        //                                 key={option.value}
        //                                 type="radio"
        //                                 id={`radio-${index}`}
        //                                 label={option.label}
        //                                 name="radioGroup"
        //                                 value={option.value}
        //                                 checked={selectedOption === option.value}
        //                                 onChange={handleChange}
        //                                 className="mb-3 "
        //                             />
        //                         ))}
        //                     </div>
        //
        //
        //                     <label className="form-label mt-2 mb-1">Название компании</label>
        //                     <input
        //                         type="text"
        //                         className="form-control"
        //                         value={companyName}
        //                         onChange={(e) => setCompanyName(e.target.value)}
        //                         required={!editId}
        //                     />
        //
        //                     <label className="form-label mt-2 mb-1">Количество счетов</label>
        //                     <input
        //                         type="text"
        //                         className="form-control"
        //                         value={numberOfAccounts}
        //                         onChange={(e) => setNumberOfAccounts(e.target.value)}
        //                         required={!editId}
        //                     />
        //
        //                     <label className="form-label mt-2 mb-1">ИНН</label>
        //                     <input
        //                         type="text"
        //                         className="form-control"
        //                         value={Inn}
        //                         onChange={(e) => setInn(e.target.value)}
        //                         required={!editId}
        //                     />
        //
        //                     <label className="form-label mt-2 mb-1">Email</label>
        //                     <input
        //                         type="text"
        //                         className="form-control"
        //                         value={email}
        //                         onChange={(e) => setEmail(e.target.value)}
        //                         required={!editId}
        //                     />
        //                 </div>
        //
        //
        //               <div className="text-center mt-4">
        //                 <button className="btn btn-primary me-4" type="submit">
        //                   {editId ? "Сохранить изменения" : "Создать заявку"}
        //                 </button>
        //                   <button className="btn btn-primary ms-2" onClick={() => setActive("right")}>
        //                       Мои заявки
        //                   </button>
        //               </div>
        //
        //
        //                 {editId && (
        //                     <button
        //                         type="button"
        //                         className="btn btn-secondary ms-2"
        //                         onClick={() => {
        //                             setEditId(null);
        //                             // setOgrn("");
        //                             setAppNumber("");
        //                             setError(null);
        //                         }}
        //                     >
        //                         Отмена
        //                     </button>
        //                 )}
        //             </form>
        //         </div>
        //         }
        //         {active=="right" &&
        //         <div className="card-body">
        //
        //         </div>
        //         }
        //     </div>
        //
        //     {/*<h3>Ваши заявки</h3>*/}
        //     {/*<ul className="list-group">*/}
        //     {/*  {requests.length === 0 && <li className="list-group-item">Заявок нет</li>}*/}
        //     {/*  {requests.map((req) => (*/}
        //     {/*    <li*/}
        //     {/*      key={req.id}*/}
        //     {/*      className="list-group-item d-flex justify-content-between align-items-center"*/}
        //     {/*    >*/}
        //     {/*      <div>*/}
        //     {/*        <strong>ОГРН:</strong> {req.ogrn}*/}
        //     {/*        <br />*/}
        //     {/*        <strong>Номер:</strong> {req.appNumber}*/}
        //     {/*      </div>*/}
        //     {/*      <div>*/}
        //     {/*        <button*/}
        //     {/*          className="btn btn-sm btn-outline-secondary me-2"*/}
        //     {/*          onClick={() => handleEdit(req)}*/}
        //     {/*        >*/}
        //     {/*          ✏️*/}
        //     {/*        </button>*/}
        //     {/*        <button*/}
        //     {/*          className="btn btn-sm btn-outline-danger"*/}
        //     {/*          onClick={() => handleDelete(req.id)}*/}
        //     {/*        >*/}
        //     {/*          🗑️*/}
        //     {/*        </button>*/}
        //     {/*      </div>*/}
        //     {/*    </li>*/}
        //     {/*  ))}*/}
        //     {/*</ul>*/}
        // </div>
    );
};


export default App;