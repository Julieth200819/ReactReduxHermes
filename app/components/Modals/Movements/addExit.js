"use client";
import React, { useState, useEffect } from 'react';
import { IoIosArrowBack } from "react-icons/io";
import { FiSave } from "react-icons/fi";
import PeopleService from '@/app/services/peopleService';
import { notifySuccess, notifyError } from '../../../components/notification';
import exitService from '@/app/services/exitService';
import entranceService from '@/app/services/entranceService';

const AddExit = ({ isOpen, onClose }) => {
    const [dateTime] = useState(new Date().toLocaleString());
    const [personId, setPersonId] = useState('');   
    const [errors, setErrors] = useState({});
    const [equipmentOptions, setEquipmentOptions] = useState([]);
    const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState([]);
    const [documentNumber, setDocumentNumber] = useState('');
    const [isButtonEnabled, setIsButtonEnabled] = useState(false);
    const [lastHeadquarterName, setLastHeadquarterName] = useState('');
    const [personName, setPersonName] = useState('');
    const [personLastName, setPersonLastName] = useState('');
    const [lastEntranceId, setLastEntranceId] = useState(null);

    useEffect(() => {
        const fetchLastEntryEquipment = async () => {
            if (personId) {
                try {
                    const response = await entranceService.getAll();  
                    const entries = response.data.data;
                    
                    const personEntries = entries.filter(entrance => 
                        entrance.person.id === parseInt(personId)
                    );

                    if (personEntries.length > 0) {
                        const lastEntrance = personEntries.sort((a, b) => 
                            new Date(b.dateTime) - new Date(a.dateTime)
                        )[0];
                        
                        setLastEntranceId(lastEntrance.id);
                        setLastHeadquarterName(lastEntrance.headquarter.name || 'Sede no especificada');

                        if (lastEntrance.equipmentList?.length > 0) {
                            const formattedEquipment = lastEntrance.equipmentList.map(equipment => ({
                                id: equipment.id,
                                name: equipment.brand,
                                brand: equipment.brand,
                                model: equipment.model,
                                serial: equipment.serial
                            }));
                            setEquipmentOptions(formattedEquipment);
                        } else {
                            setEquipmentOptions([]);
                        }
                    } else {
                        setLastHeadquarterName('No se encontraron entradas');
                        setEquipmentOptions([]);
                    }
                } catch (error) {
                    console.error("Error al obtener las entradas y equipos:", error);
                    setLastEntranceId(null);
                    setLastHeadquarterName('Error al cargar la sede');
                    setEquipmentOptions([]);
                }
            }
        };
    
        fetchLastEntryEquipment();
    }, [personId]);

    const fetchPersonData = async (documentNumber) => {
        setDocumentNumber(documentNumber);
        if (documentNumber) {
            try {
                const response = await PeopleService.getPersonByDocument(documentNumber);
                const personData = response.data.data;
                setPersonId(personData.id);
                setPersonName(personData.name);
                setPersonLastName(personData.lastname);
                setErrors(prevErrors => ({ ...prevErrors, person_id: "" }));
                setIsButtonEnabled(true);
            } catch (error) {
                console.error("Error al buscar persona:", error);
                setPersonName('');
                setPersonLastName('');
                setPersonId('');
                setIsButtonEnabled(false);
                setErrors(prevErrors => ({
                    ...prevErrors,
                    person_id: "No se encontró a la persona con este documento"
                }));
            }
        } else {
            setIsButtonEnabled(false);
            setPersonName('');
            setPersonLastName('');
            setPersonId('');
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!documentNumber) {
            newErrors.person = "El documento de la persona es obligatorio";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!documentNumber) {
            notifyError("El documento de la persona es obligatorio");
            return;
        }

        if (validateForm()) {
            const newExit = {
                data: {
                    person: parseInt(documentNumber),
                    equipments: selectedEquipment.map(equipmentId => ({
                        id: equipmentId
                    }))
                }
            };

            try {
                console.log('Datos a enviar:', newExit);
                await exitService.postExit(newExit);
                onClose();
                notifySuccess('¡La salida se ha registrado correctamente!');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } catch (error) {
                console.error("Error al guardar la salida:", error);
                const errorMessage = error.response?.data?.message || "Error al registrar la salida";
                notifyError(errorMessage);
            }
        }
    };

    const handleEquipmentSelection = (equipmentId) => {
        setSelectedEquipment((prevSelected) => {
            if (prevSelected.includes(equipmentId)) {
                return prevSelected.filter(id => id !== equipmentId);
            } else {
                return [...prevSelected, equipmentId];
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-70 backdrop-blur-sm">
            <div className="relative w-full max-w-screen-sm p-4 rounded-lg shadow-lg transition-transform transform-gpu scale-95 hover:scale-100 dark:bg-gray-800 bg-opacity-91 bg-white max-h-[90vh] overflow-auto">
                <div className="flex items-center justify-between p-4 border-b border-custom-blues dark:border-green-500">
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white rounded-full p-2"
                    >
                        <IoIosArrowBack />
                    </button>
                    <div className="text-center flex-grow">
                        <h2 className="text-2xl font-medium dark:text-white">Registrar Salida</h2>
                        <p className="text-gray-500">Completa la información para registrar una salida.</p>
                    </div>
                </div>

                {/* Parte Superior del Cuerpo */}
                <div className="p-4 space-y-4">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="document" className="block mb-2 dark:text-white font-medium">Documento:</label>
                            <input
                                type="text"
                                id="document"
                                value={documentNumber}
                                onChange={(e) => fetchPersonData(e.target.value)}
                                placeholder="Ingrese el documento"
                                className="block w-full p-2 border rounded-lg text-gray-500 dark:bg-gray-700 border-custom-green dark:text-white"
                            />
                    </div>                        
                        
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="personName" className="block mb-2 dark:text-white font-medium">Nombre:</label>
                            <input
                                type="text"
                                id="personName"
                                value={personName}
                                disabled
                                className="block w-full p-2 border rounded-lg text-gray-500 dark:bg-gray-700 border-custom-green dark:text-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="personLastName" className="block mb-2 dark:text-white font-medium">Apellido:</label>
                            <input
                                type="text"
                                id="personLastName"
                                value={personLastName}
                                disabled
                                className="block w-full p-2 border rounded-lg text-gray-500 dark:bg-gray-700 border-custom-green dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Parte Inferior del Cuerpo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                    <div>
                        <label htmlFor="dateTime" className="block mb-2 dark:text-white font-medium">Fecha y Hora:</label>
                        <input
                            id="dateTime"
                            value={dateTime}
                            disabled
                            className="block w-full p-2 border rounded-lg text-gray-500 dark:bg-gray-700 border-custom-green dark:text-white"
                        />
                    </div>
                    <div>
                        <label htmlFor="headquarterId" className="block mb-2 dark:text-white font-medium">Sede:</label>
                        <input
                            type="text"
                            id="headquarterId"
                            value={lastHeadquarterName}
                            disabled
                            className="block w-full p-2 border rounded-lg text-gray-500 dark:bg-gray-700 border-custom-green dark:text-white"
                        />
                    </div>
                    <div>
                        <label htmlFor="equipment_list" className="block mb-2 dark:text-white font-medium">Equipos:</label>
                        <button
                            type="button"
                            onClick={() => setIsEquipmentModalOpen(true)}
                            disabled={!isButtonEnabled}
                            className="block w-full p-2 border border-custom-blues rounded-lg text-gray-500 focus:ring-custom-green focus:border-custom-green dark:bg-gray-700 dark:text-white"
                        >
                            Seleccionar Equipos
                        </button>
                    </div>
                </div>

                {/* Modal de Selección de Equipos */}
                {isEquipmentModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-70">
                        <div className="relative bg-white dark:bg-gray-800 p-4 rounded-lg w-full max-w-lg">
                            <h3 className="text-xl font-medium mb-4">Seleccionar Equipos</h3>
                            <div className="space-y-4">
                                {equipmentOptions.map((equipment) => (
                                    <div key={equipment.id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedEquipment.includes(equipment.id)}
                                            onChange={() => handleEquipmentSelection(equipment.id)}
                                            className="mr-2"
                                        />
                                        <span>{equipment.name} - {equipment.brand} - {equipment.model}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 text-right">
                                <button
                                    onClick={() => setIsEquipmentModalOpen(false)}
                                    className="p-2 bg-gray-300 text-gray-700 rounded-lg"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-center p-4 border-t dark:border-green-500">
                    <button
                        type="button"
                        disabled={!isButtonEnabled}
                        onClick={handleSave}
                        className="flex items-center gap-2 p-2 px-4 rounded-lg text-white bg-custom-green dark:bg-green-600 hover:bg-green-700 transition-colors"
                    >
                        <FiSave className="h-5 w-5" />
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddExit;
