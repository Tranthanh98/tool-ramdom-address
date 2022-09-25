import RestService from "./httpClient.js";
import cheerio from "cheerio";
import xlsx from "xlsx";
import yargs from "yargs/yargs";

async function randomAddress() {
  const args = yargs(process.argv.slice(2)).alias({
    l: "link",
    q: "quantity",
  }).argv;

  console.log("start random");

  const link = args.link + `?quantity=${args.quantity}`;

  console.log("link:", link);

  const request = new RestService().setPath(link).get();

  const res = await request;

  const document = cheerio.load(res.data);

  const result = [];

  document("li[class=col-sm-6]").each((_, el) => {
    const oneItem = {};
    document(el)
      .contents()
      .each((_index, item) => {
        const key = document(item)
          .find("span b")
          .text()
          .trim()
          .replace(":", "");
        let value = document(document(item).find("span").contents()[1])
          .text()
          .trim();
        if (!value) {
          value = document(document(item).contents()[1]).text().trim();
        }

        oneItem[key] = value;
      });

    result.push(oneItem);
  });

  console.log("result:", result);

  const exportData = [];

  for (const i of result) {
    let addressValue = `${i.Street}, ${i.City}`;

    if (i["State/province/area"]) {
      addressValue += `, ${i["State/province/area"]}`;
    }

    if (i["Zip code"]) {
      addressValue += `, ${i["Zip code"]}`;
    }

    addressValue += `, ${i.Country}`;

    const countryCode = i["Country calling code"].replace("+", "");

    let numberPhone = i["Phone number"];

    if (numberPhone.startsWith("0")) {
      numberPhone = numberPhone.substring(1);
    }

    numberPhone = countryCode + numberPhone;

    exportData.push({ numberPhone, addressValue });
  }

  const newWB = xlsx.utils.book_new();

  const newWS = xlsx.utils.json_to_sheet(exportData);

  xlsx.utils.book_append_sheet(newWB, newWS, "name"); //workbook name as param

  xlsx.writeFile(newWB, "Data Result.xlsx"); //file name as param

  console.log("doneeeee");
}

randomAddress();
