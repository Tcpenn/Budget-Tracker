//create variable to hold db connection
let db;

//establish connection to IndexedDB database called 'budget-tracker' and set to version 1
const request = indexedDB.open('budget-tracker', 1);

//event that will emit if the version is changed
request.onupgradeneeded = function(event) {
    //reference to the DB
    const db = event.target.result;
    
    //create object store called `new_transaction`, set it to have a auto incrementing primary key of sorts
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

//upon successful
request.onsuccess = function(event) {
    //When the DB is created with the object store or made the connection, save reference to db in the global variable
    db = event.target.result;

    //checks if the app is online and if yes runs the uploadBudget() function and sends all local db data to the api
    if(navigator.online) {
        uploadBudget();
    }
}

request.onerror = function(event) {
    //log the error
    console.log(event.target.errorCode);
}

//function to submit new transaction if there is no internet connection
function saveRecord(record) {
    //open a new transaction with the databse with read nad write permissions
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //access the object for the new_transaction
    const transactionObjectStore = transaction.objectStore("new_transaction");

    //add record to your store with add method
    transactionObjectStore.add(record);
}

function uploadBudget() {
    // open a transaction on the db
    const transaction = db.transaction(['new_transaction'], 'readwrite');
  
    // access your pending object store
    const transactionObjectStore = transaction.objectStore('new_transaction');
  
    // get all records from store and set to a variable
    const getAll = transactionObjectStore.getAll();
  
    getAll.onsuccess = function() {
        // if there is data in the indexDb store, send it to the api server
        if(getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                  Accept: 'application/json, text/plain, */*',
                  'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }

                const transaction = db.transaction(['new_transaction'], 'readwrite');
                const transactionObjectStore = transaction.objectStore('new_transaction');
                // clear all items in your store
                transactionObjectStore.clear();
                alert('All transactions have been submitted');
            })
            .catch(err => {
                console.log(err)    
            });
        }
    };
}
//listen for app connecting to the internet
window.addEventListener('online', uploadBudget);