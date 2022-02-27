function on_load() {
    $(".input").prepend(create_toggle_table(5, 5));
    put_ui_in_ready_mode();
    $(".results").hide();
}

function create_toggle_table(rows, cols) {

    // var mouse_down = false;
    //
    // $(document).mousedown(function () {
    //     mouse_down = true;
    // });
    //
    // $(document).mouseup(function () {
    //     mouse_down = false;
    // })

    function toggle_square(square) {
        square.toggleClass("square_on square_off");
    }

    let table = $("<table class='board' draggable='false'></table>")
    for (let r = 0; r < rows; r++) {
        let row = $("<tr draggable='false'></tr>");
        for (let c = 0; c < cols; c++) {
            let col = $("<td class='square square_off' draggable='false'/>");
            col.mousedown(function () {
                toggle_square(col);
                mouse_down = true;
            });
            // col.mouseover(function () {
            //     if (mouse_down)
            //         toggle_square(col);
            // })
            row.append(col);
        }
        table.append(row);
    }
    return table;
}

function parse_table() {
    return $(".input table.board").children("tr").get().map(function (tr) {
        return $(tr).children("td").get().map(function (td) {
            return $(td).hasClass("square_on") ? 1 : 0;
        });
    });
}

function solve(algorithm = "orderless", args = {}, retry = true) {
    $(".results").hide();
    clear_message();

    let board = parse_table();
    let board_str = board.map(function (row) {
        return row.map(function (col) {
            return col.toString();
        }).join("")
    }).join("|");
    console.log(board_str)

    put_ui_in_wait_mode();
    let url = `https://api.protolock.sprelf.com/solve`;
    $.ajax({
        url: `${url}?board=${encodeURIComponent(board_str)}&algorithm=${algorithm}&game=mezzonic`,
        method: "POST",
        data: JSON.stringify(args),
        dataType: "json",
        cors: true,
        contentType: "application/json",
        success: function (result) {
            console.log(result);
            output_results(result.steps);
            put_ui_in_ready_mode();
        },
        error: function (xhr, options, error) {
            let response = xhr.responseJSON;
            let timed_out = response && response.message === "Endpoint request timed out";
            if (timed_out && retry) {
                solve("exhaustive", {"mode": "mixed", "limit": 15}, false);
                set_message("Default algorithm is taking too long.  Trying a different method...","warn")
            } else {
                console.log(xhr);
                put_ui_in_ready_mode();
                if (timed_out)
                    set_message("Second attempt also timed out.  You're on your own, sorry!", "error");
                else if (response && response.Description === "NO PATH FOUND")
                    set_message("No solution found.  Are you sure the input is correct?", "error");
                else
                    set_message("Some kind of error occurred.  See console for details.", "error");
            }
        }
    });
}

function put_ui_in_wait_mode() {
    $(".buttons button").prop("disabled", true);
    $(".loader").show();
}

function put_ui_in_ready_mode() {
    $(".buttons button").prop("disabled", false);
    $(".loader").hide();
}

function set_message(message, type) {
    let message_area = $(".message");
    message_area.empty();
    message_area.append($(`<p class='${type}'>${message}</p>`))
}

function clear_message() {
    $(".message").empty();
}


function output_results(steps) {

    $(".results").show();
    clear_message();

    // OUTPUT SOLUTION

    let solution_div = $("#solution")
    solution_div.empty()

    let transitions = steps.filter(function (step) {
        return step.transition;
    }).map(function (step) {
        return step.transition;
    });

    solution_div.append(build_mezzonic_table(steps[0].state, transitions));


    // OUTPUT STEPS

    let step_div = $("#steps");
    step_div.empty();

    steps.forEach(function (step, i) {
        let transition = i + 1 < steps.length ? steps[i + 1].transition : null;
        let board = step.state;

        step_div.append(build_mezzonic_table(board, [transition]));

    });
}


function build_mezzonic_table(board, transitions) {

    let table = $("<table class='board'></table>");
    board.squares.forEach(function (row, r) {
        let row_elem = $("<tr></tr>")
        row.forEach(function (col, c) {
            let col_elem = $("<td class='square square_off'></td>");
            if (col === 1)
                col_elem.toggleClass("square_on square_off")
            if (transitions.some(function (transition) {
                return transition && c === transition.col && r === transition.row
            }))
                col_elem.toggleClass("square_selected")
            row_elem.append(col_elem);
        });
        table.append(row_elem);
    });
    return table
}

function reset() {
    clear_message();
    $(".input table.board").children("tr").get().forEach(function (tr) {
        $(tr).children("td").get().forEach(function (td) {
            if ($(td).hasClass("square_on"))
                $(td).toggleClass("square_on square_off");
        });
    });
    $(".results").hide();
}