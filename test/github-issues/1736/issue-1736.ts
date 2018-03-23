import "reflect-metadata";
import {DateUtils} from "../../../src/util/DateUtils";
import {expect} from "chai";

describe.only("github issues > #1736 Milliseconds are parsed incorrectly from datetime string", () => {

    it("should correctly parse milliseconds from datetime string", () =>  {
        const date = new Date("2018-03-10T16:13:08.002Z");
        console.log(DateUtils.mixedDateToDatetimeString(date));
        expect(DateUtils.mixedDateToDatetimeString(date)).to.be.equal("2018-03-10 21:13:08.002");

        console.log(DateUtils.mixedDateToDatetimeString("2018-03-10T16:13:08.020Z"));
        expect(DateUtils.mixedDateToDatetimeString("2018-03-10T16:13:08.020Z")).to.be.equal("2018-03-10 21:13:08.020");

        console.log(DateUtils.mixedDateToDatetimeString("2018-03-10T16:13:08.200Z"));
        expect(DateUtils.mixedDateToDatetimeString("2018-03-10T16:13:08.200Z")).to.be.equal("2018-03-10 21:13:08.200");

        // expect(DateUtils.mixedDateToUtcDatetimeString("2018-03-10T16:13:08.002Z")).to.be.equal("2018-03-10 16:13:08.002");
        // console.log(DateUtils.mixedDateToUtcDatetimeString("2018-03-10T16:13:08.002Z"));
        // expect(DateUtils.mixedDateToUtcDatetimeString("2018-03-10T16:13:08.020Z")).to.be.equal("2018-03-10 16:13:08.020");
        // console.log(DateUtils.mixedDateToUtcDatetimeString("2018-03-10T16:13:08.020Z"));
        // expect(DateUtils.mixedDateToUtcDatetimeString("2018-03-10T16:13:08.200Z")).to.be.equal("2018-03-10 16:13:08.200");
        // console.log(DateUtils.mixedDateToUtcDatetimeString("2018-03-10T16:13:08.200Z"));
    });

});
