#!/usr/bin/env python3
"""Patch content.json weekly schedule from PDF + PM class updates."""
import json

path = "/workspace/household-hub/data/content.json"
with open(path, encoding="utf-8") as f:
    data = json.load(f)

def t(en, fil=None):
    return {"en": en, "fil": fil or en}

school = "Lam Tin Ling Liang Kindergarten"

data["weeklySchedule"] = [
    {
        "dayKey": "monday",
        "day": t("Monday", "Lunes"),
        "tasks": [
            {"id": "m1", "time": "07:30", "task": t("ZiZi wake up", "Gisingin si Zizi")},
            {"id": "m2", "time": "07:45", "task": t("ZiZi milk / breakfast / brush teeth", "Gatas / almusal / sipilyo ni Zizi")},
            {"id": "m3", "time": "09:30", "task": t("Wash clothing (all clothes first, then Charlene's clothes)", "Labada (lahat ng damit muna, tapos damit ni Charlene)")},
            {"id": "m4", "time": "10:00", "task": t("Vacuum floor, deep clean floor (mop), toilet", "Vacuum, malalim na pagmop, linis ng toilet")},
            {"id": "m5", "time": "11:30", "task": t("Flexible / monthly task (see list)", "Flexible / buwanang gawain (tingnan ang list)")},
            {"id": "m6", "time": "12:00", "task": t("ZiZi lunch at home", "Tanghalian ni Zizi sa bahay")},
            {"id": "m7", "time": "12:45", "task": t("Prepare school bag, shoes, uniform", "Ihanda ang bag, sapatos, uniporme")},
            {"id": "m8", "time": "13:00", "task": t(f"Send Zizi to {school} (PM class)", f"Hatid si Zizi sa {school} (PM class)")},
            {"id": "m9", "time": "13:00", "task": t("Charlene rest time (while Zizi at school)", "Oras ng pahinga ni Charlene (habang nasa eskwela si Zizi)")},
            {"id": "m10", "time": "14:00", "task": t("Buy food", "Bumili ng pagkain")},
            {"id": "m11", "time": "16:00", "task": t(f"Pick up Zizi from {school}", f"Sunduin si Zizi sa {school}")},
            {"id": "m12", "time": "16:30", "task": t("ZiZi tea time", "Merienda ni Zizi")},
            {"id": "m13", "time": "17:00", "task": t("Prepare food — check tonight's random dinner menu (meat + veg + soup)", "Maghanda — tingnan ang random na hapunan (karne + gulay + sabaw)")},
            {"id": "m14", "time": "18:00", "task": t("Cook dinner", "Magluto ng hapunan")},
            {"id": "m15", "time": "18:30", "task": t("ZiZi dinner (6:30–8:00 PM)", "Hapunan ni Zizi (6:30–8:00 PM)")},
            {"id": "m16", "time": "20:15", "task": t("Wash dishes / tidy up kitchen", "Hugasan ang pinggan / ayusin ang kusina")},
            {"id": "m17", "time": "20:30", "task": t("Vacuum floor", "Vacuum ng sahig")},
            {"id": "m18", "time": "21:15", "task": t("ZiZi shower and milk", "Paligo at gatas ni Zizi")},
            {"id": "m19", "time": "21:45", "task": t("Charlene rest time", "Oras ng pahinga ni Charlene")},
        ],
    },
    {
        "dayKey": "tuesday",
        "day": t("Tuesday", "Martes"),
        "tasks": [
            {"id": "t1", "time": "07:30", "task": t("ZiZi wake up", "Gisingin si Zizi")},
            {"id": "t2", "time": "07:45", "task": t("ZiZi milk / breakfast / brush teeth", "Gatas / almusal / sipilyo ni Zizi")},
            {"id": "t3", "time": "09:30", "task": t("Clean Zizi toys", "Linisin ang mga laruan ni Zizi")},
            {"id": "t4", "time": "10:00", "task": t("Vacuum floor, vacuum/deep clean living room, toilet", "Vacuum, malalim na linis ng sala, toilet")},
            {"id": "t5", "time": "11:30", "task": t("Flexible / monthly task", "Flexible / buwanang gawain")},
            {"id": "t6", "time": "12:00", "task": t("ZiZi lunch at home", "Tanghalian ni Zizi sa bahay")},
            {"id": "t7", "time": "12:45", "task": t("Prepare for PM school", "Maghanda para sa PM na eskwela")},
            {"id": "t8", "time": "13:00", "task": t(f"Send Zizi to {school} (PM class)", f"Hatid si Zizi sa {school} (PM class)")},
            {"id": "t9", "time": "13:00", "task": t("Charlene rest time", "Oras ng pahinga ni Charlene")},
            {"id": "t10", "time": "14:00", "task": t("Buy food (AEON @ Yau Tong)", "Bumili ng pagkain (AEON @ Yau Tong)")},
            {"id": "t11", "time": "16:00", "task": t(f"Pick up Zizi from {school}", f"Sunduin si Zizi sa {school}")},
            {"id": "t12", "time": "16:30", "task": t("ZiZi tea time", "Merienda ni Zizi")},
            {"id": "t13", "time": "17:00", "task": t("Prepare food & soup — tonight's random menu", "Maghanda ng pagkain at sabaw — random na menu")},
            {"id": "t14", "time": "18:00", "task": t("Cook", "Magluto")},
            {"id": "t15", "time": "18:30", "task": t("ZiZi dinner", "Hapunan ni Zizi")},
            {"id": "t16", "time": "20:15", "task": t("Wash dishes / tidy kitchen", "Hugasan / ayusin ang kusina")},
            {"id": "t17", "time": "20:30", "task": t("Vacuum floor", "Vacuum ng sahig")},
            {"id": "t18", "time": "21:15", "task": t("ZiZi shower and milk", "Paligo at gatas ni Zizi")},
            {"id": "t19", "time": "21:45", "task": t("Charlene rest time", "Oras ng pahinga ni Charlene")},
        ],
    },
    {
        "dayKey": "wednesday",
        "day": t("Wednesday", "Miyerkules"),
        "tasks": [
            {"id": "w1", "time": "07:30", "task": t("ZiZi wake up", "Gisingin si Zizi")},
            {"id": "w2", "time": "07:45", "task": t("ZiZi milk / breakfast / brush teeth", "Gatas / almusal / sipilyo ni Zizi")},
            {"id": "w3", "time": "10:00", "task": t("Vacuum floor, deep clean kitchen (water/bread/coffee machine), toilet", "Vacuum, malalim na linis ng kusina, toilet")},
            {"id": "w4", "time": "11:30", "task": t("Flexible / monthly task", "Flexible / buwanang gawain")},
            {"id": "w5", "time": "12:00", "task": t("ZiZi lunch at home", "Tanghalian ni Zizi sa bahay")},
            {"id": "w6", "time": "12:45", "task": t("Prepare for PM school", "Maghanda para sa PM na eskwela")},
            {"id": "w7", "time": "13:00", "task": t(f"Send Zizi to {school} (PM class)", f"Hatid si Zizi sa {school} (PM class)")},
            {"id": "w8", "time": "13:00", "task": t("Charlene rest time", "Oras ng pahinga ni Charlene")},
            {"id": "w9", "time": "14:00", "task": t("Buy food", "Bumili ng pagkain")},
            {"id": "w10", "time": "16:00", "task": t(f"Pick up Zizi from {school}", f"Sunduin si Zizi sa {school}")},
            {"id": "w11", "time": "16:30", "task": t("ZiZi tea time", "Merienda ni Zizi")},
            {"id": "w12", "time": "17:00", "task": t("Prepare food — tonight's random menu", "Maghanda — random na menu ng gabi")},
            {"id": "w13", "time": "18:00", "task": t("Cook", "Magluto")},
            {"id": "w14", "time": "18:30", "task": t("ZiZi dinner", "Hapunan ni Zizi")},
            {"id": "w15", "time": "20:15", "task": t("Wash dishes / tidy kitchen", "Hugasan / ayusin ang kusina")},
            {"id": "w16", "time": "20:30", "task": t("Vacuum floor", "Vacuum ng sahig")},
            {"id": "w17", "time": "21:15", "task": t("ZiZi shower and milk", "Paligo at gatas ni Zizi")},
            {"id": "w18", "time": "21:45", "task": t("Charlene rest time", "Oras ng pahinga ni Charlene")},
        ],
    },
    {
        "dayKey": "thursday",
        "day": t("Thursday", "Huwebes"),
        "tasks": [
            {"id": "th1", "time": "07:30", "task": t("ZiZi wake up", "Gisingin si Zizi")},
            {"id": "th2", "time": "07:45", "task": t("ZiZi milk / breakfast / brush teeth", "Gatas / almusal / sipilyo ni Zizi")},
            {"id": "th3", "time": "10:00", "task": t("Vacuum floor, deep clean toilet (faucet/shower/mat/washing machine/curtain), toilet", "Vacuum, malalim na linis ng banyo, toilet")},
            {"id": "th4", "time": "11:30", "task": t("Flexible / monthly task", "Flexible / buwanang gawain")},
            {"id": "th5", "time": "12:00", "task": t("ZiZi lunch at home", "Tanghalian ni Zizi sa bahay")},
            {"id": "th6", "time": "12:45", "task": t("Prepare for PM school", "Maghanda para sa PM na eskwela")},
            {"id": "th7", "time": "13:00", "task": t(f"Send Zizi to {school} (PM class)", f"Hatid si Zizi sa {school} (PM class)")},
            {"id": "th8", "time": "13:00", "task": t("Charlene rest time", "Oras ng pahinga ni Charlene")},
            {"id": "th9", "time": "14:00", "task": t("Buy food", "Bumili ng pagkain")},
            {"id": "th10", "time": "16:00", "task": t(f"Pick up Zizi from {school}", f"Sunduin si Zizi sa {school}")},
            {"id": "th11", "time": "16:30", "task": t("ZiZi tea time", "Merienda ni Zizi")},
            {"id": "th12", "time": "17:00", "task": t("Prepare food & soup — tonight's random menu", "Maghanda ng pagkain at sabaw")},
            {"id": "th13", "time": "18:00", "task": t("Cook", "Magluto")},
            {"id": "th14", "time": "18:30", "task": t("ZiZi dinner", "Hapunan ni Zizi")},
            {"id": "th15", "time": "20:15", "task": t("Wash dishes / tidy kitchen", "Hugasan / ayusin ang kusina")},
            {"id": "th16", "time": "20:30", "task": t("Vacuum floor", "Vacuum ng sahig")},
            {"id": "th17", "time": "21:15", "task": t("ZiZi shower and milk", "Paligo at gatas ni Zizi")},
            {"id": "th18", "time": "21:45", "task": t("Charlene rest time", "Oras ng pahinga ni Charlene")},
        ],
    },
    {
        "dayKey": "friday",
        "day": t("Friday", "Biyernes"),
        "tasks": [
            {"id": "f1", "time": "07:30", "task": t("ZiZi wake up", "Gisingin si Zizi")},
            {"id": "f2", "time": "07:45", "task": t("ZiZi milk / breakfast / brush teeth", "Gatas / almusal / sipilyo ni Zizi")},
            {"id": "f3", "time": "10:00", "task": t("Vacuum floor, deep clean bedroom, toilet", "Vacuum, malalim na linis ng kwarto, toilet")},
            {"id": "f4", "time": "11:30", "task": t("Flexible / monthly task", "Flexible / buwanang gawain")},
            {"id": "f5", "time": "12:00", "task": t("ZiZi lunch at home", "Tanghalian ni Zizi sa bahay")},
            {"id": "f6", "time": "12:45", "task": t("Prepare for PM school", "Maghanda para sa PM na eskwela")},
            {"id": "f7", "time": "13:00", "task": t(f"Send Zizi to {school} (PM class)", f"Hatid si Zizi sa {school} (PM class)")},
            {"id": "f8", "time": "13:00", "task": t("Charlene rest time", "Oras ng pahinga ni Charlene")},
            {"id": "f9", "time": "14:00", "task": t("Buy food", "Bumili ng pagkain")},
            {"id": "f10", "time": "16:00", "task": t(f"Pick up Zizi from {school}", f"Sunduin si Zizi sa {school}")},
            {"id": "f11", "time": "16:30", "task": t("ZiZi tea time", "Merienda ni Zizi")},
            {"id": "f12", "time": "17:00", "task": t("Prepare food — tonight's random menu", "Maghanda — random na menu")},
            {"id": "f13", "time": "18:00", "task": t("Cook", "Magluto")},
            {"id": "f14", "time": "18:30", "task": t("ZiZi dinner", "Hapunan ni Zizi")},
            {"id": "f15", "time": "20:15", "task": t("Wash dishes / tidy kitchen", "Hugasan / ayusin ang kusina")},
            {"id": "f16", "time": "20:30", "task": t("Vacuum floor", "Vacuum ng sahig")},
            {"id": "f17", "time": "21:15", "task": t("ZiZi shower and milk", "Paligo at gatas ni Zizi")},
            {"id": "f18", "time": "21:45", "task": t("Charlene rest time", "Oras ng pahinga ni Charlene")},
        ],
    },
    {
        "dayKey": "saturday",
        "day": t("Saturday", "Sabado"),
        "tasks": [
            {"id": "s1", "time": "07:30", "task": t("ZiZi wake up", "Gisingin si Zizi")},
            {"id": "s2", "time": "07:45", "task": t("ZiZi milk / breakfast / brush teeth", "Gatas / almusal / sipilyo ni Zizi")},
            {"id": "s3", "time": "09:30", "task": t("Vacuum floor, toilet, iron clothing", "Vacuum, toilet, plantsa ng damit")},
            {"id": "s4", "time": "11:30", "task": t("Flexible / monthly task", "Flexible / buwanang gawain")},
            {"id": "s5", "time": "12:00", "task": t("Play with ZiZi", "Maglaro kasama si Zizi")},
            {"id": "s6", "time": "13:00", "task": t("Zizi nap time + clean school bag & shoes", "Oras ng tulog ni Zizi + linisin ang bag at sapatos")},
            {"id": "s7", "time": "14:00", "task": t("Buy food", "Bumili ng pagkain")},
            {"id": "s8", "time": "16:00", "task": t("Prepare food", "Maghanda ng pagkain")},
            {"id": "s9", "time": "16:30", "task": t("ZiZi tea time", "Merienda ni Zizi")},
            {"id": "s10", "time": "17:00", "task": t("Play with ZiZi", "Maglaro kasama si Zizi")},
            {"id": "s11", "time": "18:00", "task": t("Cook — tonight's random menu", "Magluto — random na menu")},
            {"id": "s12", "time": "18:30", "task": t("ZiZi dinner", "Hapunan ni Zizi")},
            {"id": "s13", "time": "20:15", "task": t("Wash dishes / tidy kitchen", "Hugasan / ayusin ang kusina")},
            {"id": "s14", "time": "20:30", "task": t("Vacuum floor", "Vacuum ng sahig")},
            {"id": "s15", "time": "21:15", "task": t("ZiZi shower and milk", "Paligo at gatas ni Zizi")},
            {"id": "s16", "time": "21:45", "task": t("Charlene rest time", "Oras ng pahinga ni Charlene")},
        ],
    },
    {
        "dayKey": "sunday",
        "day": t("Sunday", "Linggo"),
        "tasks": [
            {"id": "su1", "time": "07:30", "task": t("Charlene day off", "Day off ni Charlene")},
            {"id": "su2", "time": "09:30", "task": t("Wash clothing (light color)", "Labada (magaan na kulay)")},
            {"id": "su3", "time": "10:00", "task": t("Wash clothing (dark color)", "Labada (madilim na kulay)")},
            {"id": "su4", "time": "11:30", "task": t("Flexible / monthly task", "Flexible / buwanang gawain")},
            {"id": "su5", "time": "12:00", "task": t("Family time — focus on Zizi", "Oras ng pamilya — focus kay Zizi")},
            {"id": "su6", "time": "14:00", "task": t("Buy food", "Bumili ng pagkain")},
            {"id": "su7", "time": "16:00", "task": t("Prepare food", "Maghanda ng pagkain")},
            {"id": "su8", "time": "18:00", "task": t("Cook — tonight's random menu", "Magluto — random na menu")},
            {"id": "su9", "time": "18:30", "task": t("ZiZi dinner", "Hapunan ni Zizi")},
            {"id": "su10", "time": "20:15", "task": t("Wash dishes / tidy kitchen", "Hugasan / ayusin ang kusina")},
            {"id": "su11", "time": "20:30", "task": t("Vacuum floor", "Vacuum ng sahig")},
            {"id": "su12", "time": "21:15", "task": t("ZiZi shower and milk", "Paligo at gatas ni Zizi")},
            {"id": "su13", "time": "21:45", "task": t("Charlene day off", "Day off ni Charlene")},
        ],
    },
]

if "weeklyMeals" in data:
    del data["weeklyMeals"]

data["lastUpdated"] = "2026-07-20T07:56:00.000Z"

with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated schedule")
