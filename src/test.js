import { Scene } from "./module/scene.js";
import { GridWidget } from "./module/widgets/grid.js";
import { ConnectorAddon } from "./module/addons/connector.js";
import { ConnDisplay, ConnInput, ConnWidget } from "./module/widgets/connWidget.js";
import { PeerConnection } from "./module/conn/distros/peer.js";
ConnectorAddon.setStyle("data", "input", { background: "white" });
ConnectorAddon.setStyle("data", "output", { background: "black" });
ConnectorAddon.setStyle("data", "omni", { background: "radial-gradient(black, black 50%, white 50%, white)" });
const $ = document.querySelector.bind(document);
const clientId = location.search.substring(1).split(":")[0];
const routerId = location.search.substring(1).split(":")[1] ?? null;
const conn = new PeerConnection(Peer, "fw");
const client = conn.buildClient(clientId);
if (routerId)
    client.routerId = routerId;
client.listener.on("connect", (data) => { console.log("connect:", data); });
client.listener.on("disconnect", (data) => { console.log("disconnect:", data); });
const channel = client.buildChannel("default");
const connW = new ConnWidget(channel);
const scene = new Scene({
    parent: $("#sandbox"),
    style: {
        // width: "100vw",
        // height: "100vh",
        background: "white"
    },
    doStartCentered: true,
    options: {
        // scrollX: false,
        // scrollY: false
        zoom: {
            max: 1e2,
            min: 1e-2
        }
    },
    widgets: [
        new GridWidget({
            style: {
                background: "cornsilk"
            },
            options: {
                coords: true
            },
            doCursorDragIcon: true
        }),
        connW,
        new ConnDisplay(),
        new ConnInput()
    ]
});
// connW.pos.animatePos(
//   new FAnimation({ time: 5000 }),
//   { "x": 100, "y": 100 }
// )
// setInterval(() => {
//   (widget2.addons.get("main") as ConnectorAddon<"output" | "input" | "omni">).sender.trigger("send", "clock pulse");
// }, 100);
// (widget1.addons.get("main") as ConnectorAddon<"output" | "input" | "omni">).sender.on("receive", (data) => { console.log(data) });
// (widget1.addons.get("main") as ConnectorAddon<"output" | "input" | "omni">).sender.on("disconnect", (data) => { console.log(data, "disconencted") })
function connValidator(dir1, dir2) {
    return (dir1 == "input" && dir2 == "output") || (dir1 == "output" && dir2 == "input") || (dir1 == "omni") || (dir2 == "omni");
}
// scene.addGlobalSnapObject(
//   new Grid<"x"|"y">(
//     new Pos<"x"|"y">({
//       x: {val: 50},
//       y: {val: 50}
//     }),
//     new Pos<"x"|"y">({})
//   )
// )
// sceneHolder.style.width = "100%";
// sceneHolder.style.height = "100%";
// new Scene({
//   parent: sceneHolder,
//   widgets: [
//     new GridWidget({
//       doCursorDragIcon: true,
//       doIndependentCenter: false,
//       style: {
//       }
//     }),
//     new DraggableWidget({
//       content: scene2Holder,
//       name: "Top b",
//       header: {
//         title: "Top",
//       },
//       style: {
//         width: "200px",
//         height: "200px"
//       },
//       positioning: 1,
//       pos: {
//         xAlign: "middle",
//         yAlign: "middle"
//       }
//     })
//   ],
//   doStartCentered: true
// })
// // scene2Holder.style.width = "100%";
// // scene2Holder.style.height = "100%";
// // new Scene({
// //   parent: scene2Holder,
// //   widgets: [
// //     new GridWidget({
// //       doCursorDragIcon: true,
// //       doIndependentCenter: false,
// //       style: {
// //       }
// //     }),
// //     new DraggableWidget({
// //       content: document.createElement("div"),
// //       name: "Top b",
// //       header: {
// //         title: "Top",
// //       },
// //       style: {
// //         width: "200px"
// //       },
// //       positioning: 1
// //     })
// //   ],
// //   doStartCentered: true
// // })
//# sourceMappingURL=test.js.map