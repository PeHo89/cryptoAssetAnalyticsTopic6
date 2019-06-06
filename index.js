//Author: Peter Holzer <e01425797@student.tuwien.ac.at>

/**
 * NOTES
 *
 * Keccak hash from ownerOf(uint256) signature: 0x6352211e6566aa027e75ac9dbf2423197fbd9b82b9d981a3ab367d355866aa1c; first 4 byte: 6352211e
 * console.log(await web3.utils.keccak256("ownerOf(uint256)"));
 *
 */

const Web3 = require('web3');
const FS = require('fs');
const { promisify } = require('util');

const web3 = new Web3('http://127.0.0.1:8546');

const ownerOfKeccakHashFirst4Bytes = '6352211e';

main();

async function main() {
	await printIsSyncing();
	//await filterErc721TxAndContracts();
	//repairData();
	//minifyTransactions();
	//compressTransactions();
	//extractUniqueAddress();
	//extractUniqueContracts();
	//prepareTransactionForVisualization();
	//extractNetworkDegreeDistribution();
	extractNetworkCentrality();
}

async function extractNetworkCentrality() {
	const readFileAsync = promisify(FS.readFile);

	const centrality = require('ngraph.centrality');
	const graph = require('ngraph.graph')();

	let aggregatedTransactions = JSON.parse(await readFileAsync('./erc721transactions_aggregated'));

	for(let i = 0; i < aggregatedTransactions.length; i++) {
		graph.addLink(aggregatedTransactions[i].from, aggregatedTransactions[i].to);
	}
	let betweenness = centrality.betweenness(graph);
	let closeness = centrality.closeness(graph);

	let betweennessKeys = Object.keys(betweenness);
	let closenessKeys = Object.keys(closeness);

	let betweennessData = [];

	for(let i = 0; i < betweennessKeys.length; i++) {
		betweennessData.push(betweenness[betweennessKeys[i]]);
	}

	let closenessData = [];

	for(let i = 0; i < closenessKeys.length; i++) {
		closenessData.push(closeness[closenessKeys[i]]);
	}

	console.log("closeness centrality labels: " + closenessKeys.length);
	console.log("closeness centrality data: " + closenessData.length);

	FS.writeFile('./closeness_centrality_labels', JSON.stringify(closenessKeys), (err) => {
		if(err) {
			console.log(err);
		}
	});

	FS.writeFile('./closeness_centrality_data', JSON.stringify(closenessData), (err) => {
		if(err) {
			console.log(err);
		}
	});

	console.log("betweenness centrality labels: " + betweennessKeys.length);
	console.log("betweenness centrality data: " + betweennessData.length);

	FS.writeFile('./betweenness_centrality_labels', JSON.stringify(betweennessKeys), (err) => {
		if(err) {
			console.log(err);
		}
	});

	FS.writeFile('./betweenness_centrality_data', JSON.stringify(betweennessData), (err) => {
		if(err) {
			console.log(err);
		}
	});
}

async function extractNetworkDegreeDistribution() {
	const readFileAsync = promisify(FS.readFile);

	let edgeDegree = [];
    let networkDegreeLabels = [];
    let networkDegreeData = [];

	let uniqueAddresses = JSON.parse(await readFileAsync('./erc721transactions_unique_addresses'));
	let aggregatedTransactions = JSON.parse(await readFileAsync('./erc721transactions_aggregated'));

	for(let i = 0; i < uniqueAddresses.length; i++) {
		let count = 0;
		for(let j = 0; j < aggregatedTransactions.length; j++) {
			if(aggregatedTransactions[j].from === uniqueAddresses[i] || aggregatedTransactions[j].to === uniqueAddresses[i]) {
				count++;
			}
		}
		edgeDegree.push({address: uniqueAddresses[i], degree: count});
	}
	console.log(edgeDegree.length);

	FS.writeFile('./erc721_degree_distribution', JSON.stringify(edgeDegree), (err) => {
		if(err) {
			console.log(err);
		}
	});

    edgeDegree.sort((a, b) => {
        if(a.degree > b.degree) {
            return 1;
        }
        if(a.degree < b.degree) {
            return -1;
        }
        return 0;
    });

    for(let i = 0; i < edgeDegree.length; i++) {
        networkDegreeLabels.push(edgeDegree[i].address);
        networkDegreeData.push(edgeDegree[i].degree);
    }

    FS.writeFile('./network_degree_labels', JSON.stringify(networkDegreeLabels), (err) => {
        if(err) {
            console.log(err);
        }
    });

    FS.writeFile('./network_degree_data', JSON.stringify(networkDegreeData), (err) => {
        if(err) {
            console.log(err);
        }
    });
}

async function prepareTransactionForVisualization() {
	const readFileAsync = promisify(FS.readFile);

	let uniqueContracts = JSON.parse(await readFileAsync('././erc721contracts_unique'));
	let uniqueAddresses = JSON.parse(await readFileAsync('./erc721transactions_unique_addresses'));
	let aggregatedTransactions = JSON.parse(await readFileAsync('./erc721transactions_aggregated'));

	let graph = {nodes: [], edges: []};

	for(let i = 0; i < uniqueAddresses.length; i++) {
		let result = uniqueContracts.find(ele => {
			return ele.address === uniqueAddresses[i];
		});
		if(result) {
			graph.nodes.push({id: uniqueAddresses[i], caption: uniqueAddresses[i], role: "contract"});
		} else {
			graph.nodes.push({id: uniqueAddresses[i], caption: uniqueAddresses[i], role: "account"});
		}
	}

	console.log('nodes: ' + graph.nodes.length); //1475

	for(let i = 0; i < aggregatedTransactions.length; i++) {
		graph.edges.push({source: aggregatedTransactions[i].from, target: aggregatedTransactions[i].to, caption: (aggregatedTransactions[i].value == 0 ? "0" : aggregatedTransactions[i].value)});
	}

	console.log('edges: ' + graph.edges.length); //1582

	FS.writeFile('./erc721transactions_graph.json', JSON.stringify(graph), (err) => {
		if(err) {
			console.log(err);
		}
	});
}

async function extractUniqueContracts() {
	const readFileAsync = promisify(FS.readFile);

	let contracts = JSON.parse(await readFileAsync('./erc721contracts'));
	let uniqueAddresses = JSON.parse(await readFileAsync('./erc721transactions_unique_addresses'));

	let uniqueContracts = [];

	for(let i = 0; i < uniqueAddresses.length; i++) {
		let result = contracts.find(ele => {
			return ele.address === uniqueAddresses[i];
		});
		if(result) {
			uniqueContracts.push({address: uniqueAddresses[i]});
		}
	}

	console.log('unique contracts: ' + uniqueContracts.length); //36

	FS.writeFile('./erc721contracts_unique', JSON.stringify(uniqueContracts), (err) => {
		if(err) {
			console.log(err);
		}
	});
}

async function extractUniqueAddress() {
	const readFileAsync = promisify(FS.readFile);

	let aggregatedTransactions = JSON.parse(await readFileAsync('./erc721transactions_aggregated'));

	let uniqueAddresses = [];

	for(let i = 0; i < aggregatedTransactions.length; i++) {
		if(i % 1000 === 0) {
			console.log(i);
		}

		let found = false;

		for(let j = 0; j < uniqueAddresses.length; j++) {
			if(aggregatedTransactions[i].from === uniqueAddresses[j]) {
				found = true;
				break;
			}
		}
		if(!found) {
			uniqueAddresses.push(aggregatedTransactions[i].from);
		}

		found = false;

		for(let j = 0; j < uniqueAddresses.length; j++) {
			if(aggregatedTransactions[i].to === uniqueAddresses[j]) {
				found = true;
				break;
			}
		}
		if(!found) {
			uniqueAddresses.push(aggregatedTransactions[i].to);
		}
	}
	console.log('size of unique addresses in transactions: ' + uniqueAddresses.length); //1475

	FS.writeFile('./erc721transactions_unique_addresses', JSON.stringify(uniqueAddresses), (err) => {
		if(err) {
			console.log(err);
		}
	});
}

async function compressTransactions() {
	const readFileAsync = promisify(FS.readFile);

	let minifiedTransactions = JSON.parse(await readFileAsync('./erc721transactions_minified'));

	console.log('size of minified transactions: ' + minifiedTransactions.length); //10000

	let aggregatedTransactions = [];

	for(let i = 0; i < minifiedTransactions.length; i++) {

		if(i % 100 === 0) {
			console.log(i);
		}

		let transaction = minifiedTransactions[i];
		let aggregatedValue = 0;

		if(Object.keys(transaction).length !== 0) {
			for(let j = 0; j < minifiedTransactions.length; j++) {

					if (transaction.from === minifiedTransactions[j].from && transaction.to === minifiedTransactions[j].to) {
						aggregatedValue += parseInt(minifiedTransactions[j].value);
						minifiedTransactions[j] = {};

					} else if (transaction.from === minifiedTransactions[j].to && transaction.to === minifiedTransactions[j].from) {
						aggregatedValue -= parseInt(minifiedTransactions[j].value);
						minifiedTransactions[j] = {};
					}

			}

			if (aggregatedValue >= 0) {
				aggregatedTransactions.push({from: transaction.from, to: transaction.to, value: aggregatedValue});
			} else {
				aggregatedTransactions.push({from: transaction.to, to: transaction.from, value: aggregatedValue * -1});
			}
		}
	}
	console.log('size of aggregated transactions: ' + aggregatedTransactions.length); //1582

	FS.writeFile('./erc721transactions_aggregated', JSON.stringify(aggregatedTransactions), (err) => {
		if(err) {
			console.log(err);
		}
	});
}

async function minifyTransactions() {
	const readFileAsync = promisify(FS.readFile);

	// let contracts = JSON.parse(await readFileAsync('./erc721contracts'));
	let transactions = JSON.parse(await readFileAsync('./erc721transactions'));

	console.log('size of transactions: ' + transactions.length); //628715

	let minifiedTransactions = [];

	for(let i = 0; i < 10000 /*transactions.length*/; i++) {
		minifiedTransactions.push({from: transactions[i].from, to: transactions[i].to, value: transactions[i].value, hash: transactions[i].hash});
	}
	console.log('size of minified transactions: ' + minifiedTransactions.length); //10000

	FS.writeFile('./erc721transactions_minified', JSON.stringify(minifiedTransactions), (err) => {
		if(err) {
			console.log(err);
		}
	});
}

function repairData() {
	FS.readFile('./erc721transactions_raw', (error, data) => {
		data = new String(data);
		data = data.replace(/\]\[/g, ',');
		console.log('size of raw transactions: ' + JSON.parse(data).length); //628715
		FS.appendFile('./erc721transactions', data, (err) => {
			if(err) {
				console.log(err);
			}
		});
	});
	FS.readFile('./erc721contracts_raw', (error, data) => {
		data = new String(data);
		data = data.replace(/\]\[/g, ',');
		FS.appendFile('./erc721contracts', data, (err) => {
			if(err) {
				console.log(err);
			}
		});
	});
}

async function filterErc721TxAndContracts() {
	for(let j = 5191500; j < 5500000; j=j+500) {
		console.log("current block range: " + j + " to "+ (j+499));
		let transferEvents = await web3.eth.getPastLogs({fromBlock: j, toBlock: j+499, topics: [web3.utils.sha3('Transfer(address,address,uint256)')]});
		let erc721Transactions = [];
		let erc721Contracts = [];
		for (let i = 0; i < transferEvents.length; i++) {
			let tx = await web3.eth.getTransaction(transferEvents[i].transactionHash);

			let toIsErc721 = await isAddressErc721Contract(tx.to);
			let fromIsErc721 = await isAddressErc721Contract(tx.from);

			if(toIsErc721 || fromIsErc721) {
				if(fromIsErc721) {
					console.log('fromIsErc721');
					erc721Contracts.push({address: tx.from});
				} else {
					erc721Contracts.push({address: tx.to});
				}
				erc721Transactions.push(tx);
			}
		}
		FS.appendFile('./erc721transactions_raw', JSON.stringify(erc721Transactions), (err) => {
			if(err) {
				console.log(err);
			}
		});
		FS.appendFile('./erc721contracts_raw', JSON.stringify(erc721Contracts), (err) => {
			if(err) {
				console.log(err);
			}
		});
	}
}

async function printIsSyncing() {
	let isSyncingResult = await web3.eth.isSyncing();
	let currentBlock = isSyncingResult.currentBlock;
	let highestBlock = isSyncingResult.highestBlock;

	if(currentBlock && highestBlock) {
		console.log('Blockchain is syncing: ' + Math.round(currentBlock/highestBlock * 100000) / 1000 + '%');
	} else {
		console.log('Blockchain is syncing: ' + JSON.stringify(isSyncingResult));
	}
}

async function isAddressErc721Contract(address) {
	if(address === null || address.length === 0) {
		return false;
	}
	const addressByteCode = await web3.eth.getCode(address);
	return addressByteCode.includes(ownerOfKeccakHashFirst4Bytes);
}
