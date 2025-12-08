import * as mysql from "mysql2/promise";

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "mywhatsapp",
});

const contactsRaw = [
    { phone: '+923125283233', name: 'Huma Bhabi' },
    { phone: '+923145167653', name: 'Wife' },
    { phone: '+923350529712', name: 'Tayyab Bhai Shop' },
    { phone: '+923316042238', name: 'Usman Bhai Ilamma Iqbal Open University' },
    { phone: '+923116306369', name: 'Meerab K Kari Sahab' },
    { phone: '+966537942739', name: 'Iftikhar Ahmed, KSA' },
    { phone: '+923343999028', name: 'Iftikhar Ahmed, KSA' },
    { phone: '+923335488784', name: 'Syed Jamal Caresoft' },
    { phone: '+923335145141', name: 'Muhammad Nadeem Samra Ki Mamme Ka Bhai' },
    { phone: '+923367773734', name: 'Bushra Principal' },
    { phone: '+923005546807', name: 'Qaiser Bhai' },
    { phone: '+923335356648', name: 'Taye G' },
    { phone: '+923468279220', name: 'JRao Adnan. Net Dev ITLP' },
    { phone: '+923215094003', name: 'Mujeeb Saeed Chacho' },
    { phone: '+923335403365', name: 'Imran And Gt' },
    { phone: '+923060557944', name: 'Khan Sahab Dokandar' },
    { phone: '+923160598003', name: 'Ayaz Khan Riaz Brother' },
    { phone: '+923130597534', name: 'Shahab Bhai QA Caresoft Khan' },
    { phone: '+923035448529', name: 'Saeed Gel WordPress Developer' },
    { phone: '+923157488639', name: 'Muhammad Ali Softlinks Dev' },
    { phone: '+923330560056', name: 'Hammad Bhai HBL' },
    { phone: '+923155505031', name: 'Riz Khan Shop' },
    { phone: '+923334322699', name: 'Aleem :-)' },
    { phone: '+923135651399', name: 'Ibtasam Sam' },
    { phone: '+923339889488', name: 'Syed Ziar Hussain Shah Caresoft' },
    { phone: '+923035552110', name: 'Cusion Waqas Saeed Chacho' },
    { phone: '+923345170785', name: 'Ghazi Chand CareSoft' },
    { phone: '+923439664216', name: 'Hassan Bhai Itlaunchpad' },
    { phone: '+923212060187', name: 'Hamad Mamo' },
    { phone: '+923325450266', name: 'Asad Bhai Caresoft QA' },
    { phone: '+923145149455', name: 'Muneeb :) Itlp' },
    { phone: '+923128552477', name: 'Asim khan Khan Sahab' },
    { phone: '+923455881465', name: 'Usman :-)' },
    { phone: '+923325568755', name: 'Tarfi Madem Khalida Son' },
    { phone: '+923130586402', name: 'Old Bike Sale Gali#3' },
    { phone: '+923125009778', name: 'Asad Bhai 125' },
    { phone: '+923132659407', name: 'Zeshan Gel It Team Designer' },
    { phone: '+923445565998', name: 'Shakeel Bhai Tandorchi' },
    { phone: '+923365762867', name: 'Mr Kashif Sahab' },
    { phone: '+923215997752', name: 'HR White color' },
    { phone: '+923344203106', name: 'Taha Ehtsham Bhai PM It Launchpad' },
    { phone: '+923262124712', name: '$h€€zi ITLP' },
    { phone: '+923139320939', name: 'Shehryar Khan Caresoft Linkdin' },
    { phone: '+923335385813', name: 'Qadeer Sahab Shop' },
    { phone: '+923129342849', name: 'Amjid Bhai Azer Tailer Saeed Bhai' },
    { phone: '+923459123145', name: 'Rizwan Bhai Caresoft' },
    { phone: '+923198302017', name: 'Abdul Rehman Plumber' },
    { phone: '+923155512292', name: 'parosi bhai dubai wala' },
    { phone: '+923185021981', name: 'Sam Mom' },
    { phone: '+923110509391', name: 'Zeshan Sam' },
    { phone: '+923315999357', name: 'Mani Parosi' },
    { phone: '+447790954977', name: 'Adan Sir Father' },
    { phone: '+923495372194', name: 'Tajamul Bhai Shorma' },
    { phone: '+923335126396', name: 'Saeed Chacho' },
    { phone: '+923007450058', name: 'Arshed Mamo' },
    { phone: '+923215831629', name: 'Mamma G' },
];

async function seed() {
    console.log("Starting seed...");
    let success = 0;
    let failed = 0;

    for (const contact of contactsRaw) {
        // Split name into first and last
        const parts = contact.name.trim().split(' ');
        const firstName = parts[0];
        const lastName = parts.slice(1).join(' ') || '-'; // Default to '-' if no last name

        try {
            await pool.execute(
                "INSERT INTO contacts (first_name, last_name, phone) VALUES (?, ?, ?)",
                [firstName, lastName, contact.phone]
            );
            console.log(`Added: ${contact.name}`);
            success++;
        } catch (error: any) {
            if (error.code === 'ER_DUP_ENTRY') {
                console.log(`Skipped (Duplicate): ${contact.name} (${contact.phone})`);
            } else {
                console.error(`Failed to add ${contact.name}:`, error.message);
            }
            failed++;
        }
    }

    console.log(`\nSeed complete!`);
    console.log(`Success: ${success}`);
    console.log(`Failed/Skipped: ${failed}`);
    process.exit(0);
}

seed();
