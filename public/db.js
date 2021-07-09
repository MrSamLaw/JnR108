let db;
let budgetVersion;

const request = indexedDB.open('BudgetDB', budgetVersion || 1);

request.onupgradeneeded = function (e) {
    console.log('Upgrade needed in IndexDB');

    const { oldVersion } = e;
    const newVersion = e.newVersion || db.Version;

    console.log(`DB Upgraded from version ${oldVersion} to ${newVersion}`);

    db = e.target.result;

    if (db.objectStoreNames.length === 0)
        db.createObjectStore('BudgetStore', { autoIncrement: true });
};

request.onerror = function (e) {
    console.log(e.target.errorCode);
};

function checkDatabase() {
    console.log('Check DB invoked');

    // Open transaction on BudgetStore DB
    let transaction = db.transaction(['BudgetStore'], 'readwrite');

    // Access BudgetStore object
    const store = transaction.objectStore('BudgetStore');

    // Get all records from store and set to a variable
    const getAll = store.getAll();

    // If request was successful
    getAll.onsuccess = function () {
        // Bulk Add Store items when online
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                },
            })
                .then((response) => response.json())
                .then((res) => {
                    // If our returned response is not empty
                    if (res.length !== 0) {
                        //Open another transaction to BudgetStore with read & write
                        transaction = db.transaction(['BudgetStore'], 'readwrite');

                        // Assign the current store to a variable
                        const currentStore = transaction.objectStore('BudgetStore');

                        // Clear existing entries after successful bulk add
                        currentStore.clear();
                        console.log('Clearing store');
                    }
                });
        }
    };
}

request.onsuccess = function (e) {
    console.log('Success');
    db = e.target.result;

    // Check if app is online before reading from db
    if (navigator.onLine) {
        console.log('Backend online!');
        checkDatabase();
    }
};

const saveRecord = (record) => {
    console.log('Save record invoked');

    // Create a transaction on the BudgetStore db with readwrite access
    const transaction = db.transaction(['BudgetStore'], 'readwrite');

    // Access BudgetStore
    const store = transaction.objectStore('BudgetStore');

    // Add record to store with add method.
    store.add(record);
};

// Listen for app coming back online
window.addEventListener('online', checkDatabase);