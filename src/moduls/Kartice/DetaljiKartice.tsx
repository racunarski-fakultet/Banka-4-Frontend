import React, { useState, useEffect } from 'react';
import { Button, Card, Typography } from '@mui/material';
import Swal from 'sweetalert2'; import { useSearchParams } from 'react-router-dom';
import { BankRoutes, Kartica, TransakcijaKarticePrikaz } from '../../utils/types';
import { makeApiRequest, makeGetRequest } from '../../utils/apiRequest';
import ListaTransakcija from './ListaTransakcija';
import { getMe } from '../../utils/getMe';

const updateKarticaStatus = async (id: number, status: string): Promise<boolean> => {
  const result = await makeApiRequest(`${BankRoutes.cards}/${status}/${id}`, "GET");
  return result ? true : false
};

export default function DetaljiKartice() {
  const [kartica, setKartica] = useState<Kartica | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [transakcije, setTransakcije] = useState<TransakcijaKarticePrikaz[] | null>()

  // Ovo će biti ID kartice dobijen iz URL-a
  let [searchParams, setSearchParams] = useSearchParams();
  const id = searchParams.get("id");
  const me = getMe();

  useEffect(() => {
    if (id) {
      console.log(id);
      //ne moze preko req
      makeGetRequest("/kartica/" + id)
        .then((result) => {
          if (!result)
            return alert("Greška pri preuzimanju kartica");

          setKartica(result);
        })
        .catch((e) => {
          alert("Greška pri preuzimanju kartica");
        });

      //ne postoje jos uvek
      makeGetRequest("/cards/transactions/" + id)
        .then((result) => {
          if (!result)
            return alert("Greška pri preuzimanju transakcija");

          setTransakcije(result);
        })
        .catch((e) => {
          alert("Greška pri preuzimanju transakcija");
        });
    }
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (kartica && await updateKarticaStatus(kartica.id, newStatus)) {
      Swal.fire('Uspeh!', `Kartica je ${newStatus}.`, 'success');
      if (newStatus != 'blokirana' && newStatus != 'aktivna' && newStatus != 'deaktivirana')
        return;
      setKartica({ ...kartica, status: newStatus });
    } else {
      Swal.fire('Greška!', 'Promena statusa nije uspela.', 'error');
    }
  };

  if (!kartica) return <div>Učitavanje...</div>;

  return (<>
    <Card style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <Typography variant="h5">{kartica.naziv}</Typography>
      <Typography>Broj kartice: {showDetails ? kartica.broj : `${kartica.broj.substring(0, 4)} xxxx xxxx ${kartica.broj.substring(12)}`}</Typography>
      <Typography>Vrsta kartice: {kartica.vrsta}</Typography>
      <Typography>Datum kreiranja: {new Date(kartica.datum_kreiranja).toLocaleDateString()}</Typography>
      <Typography>Datum isteka: {new Date(kartica.datum_isteka).toLocaleDateString()}</Typography>
      <Typography>Broj računa: {kartica.broj_racuna}</Typography>
      <Typography>CVV: {showDetails ? kartica.cvv : 'xxx'}</Typography>
      <Typography>Limit: {kartica.limit}</Typography>
      <Typography>Status: {kartica.status}</Typography>
      <Button onClick={() => setShowDetails(!showDetails)}>{showDetails ? "Sakrij informacije" : "Prikaži informacije"}</Button>
      {me?.permission ? kartica.status !== 'aktivna' && <Button onClick={() => handleStatusChange('aktivna')}>Aktiviraj</Button> : null}
      {me?.permission ? kartica.status !== 'deaktivirana' && <Button onClick={() => handleStatusChange('deaktivirana')}>Deaktiviraj</Button> : null}
      {me?.permission ? kartica.status !== 'blokirana' && <Button onClick={() => handleStatusChange('blokirana')}>Blokiraj</Button> : null}
    </Card>
    {transakcije && <ListaTransakcija transakcije={transakcije}></ListaTransakcija>}
  </>

  );
}
