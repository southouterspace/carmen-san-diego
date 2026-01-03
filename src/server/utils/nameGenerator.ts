const TITLES = [
	"Agent",
	"Detective",
	"Inspector",
	"Investigator",
	"Officer",
	"Chief",
	"Captain",
	"Lieutenant",
	"Sergeant",
];

const NAMES = [
	"Alice",
	"Bob",
	"Charlie",
	"Diana",
	"Eve",
	"Frank",
	"Grace",
	"Hank",
	"Ivy",
	"Jack",
	"Kate",
	"Leo",
	"Maya",
	"Nina",
	"Oscar",
	"Pam",
	"Quinn",
	"Rita",
	"Sam",
	"Tara",
	"Uma",
	"Victor",
	"Wade",
	"Xena",
	"Yuri",
	"Zara",
	"Ahmed",
	"Bella",
	"Carlos",
	"Dina",
	"Eli",
	"Fiona",
];

export function generateDetectiveName(): string {
	const title = TITLES[Math.floor(Math.random() * TITLES.length)];
	const name = NAMES[Math.floor(Math.random() * NAMES.length)];
	return `${title} ${name}`;
}
